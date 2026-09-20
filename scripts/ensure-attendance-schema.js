require("dotenv").config();

const db = require("../config/db");

const hasColumn = async (tableName, columnName) => {
    const [rows] = await db.query(
        `SELECT 1
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?
         LIMIT 1`,
        [tableName, columnName]
    );

    return rows.length > 0;
};

const hasIndex = async (tableName, indexName) => {
    const [rows] = await db.query(
        `SELECT 1
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND INDEX_NAME = ?
         LIMIT 1`,
        [tableName, indexName]
    );

    return rows.length > 0;
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
    if (!(await hasColumn(tableName, columnName))) {
        await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
    }
};

const ensureAttendanceSessions = async () => {
    await addColumnIfMissing("attendance_sessions", "room", "room VARCHAR(100) NULL AFTER end_time");
    await addColumnIfMissing("attendance_sessions", "topic", "topic VARCHAR(255) NULL AFTER room");
    await addColumnIfMissing(
        "attendance_sessions",
        "status",
        "status ENUM('open', 'closed') NOT NULL DEFAULT 'open' AFTER topic"
    );

    if (await hasColumn("attendance_sessions", "title")) {
        await db.query("UPDATE attendance_sessions SET topic = COALESCE(topic, title)");
    }

    await db.query(`
        UPDATE attendance_sessions s
        LEFT JOIN schedules sch ON sch.id = s.schedule_id
        SET s.room = COALESCE(s.room, sch.room),
            s.status = COALESCE(s.status, 'open')
    `);
};

const ensureAttendanceRecords = async () => {
    await addColumnIfMissing(
        "attendance_records",
        "attendance_session_id",
        "attendance_session_id INT NULL AFTER id"
    );
    await addColumnIfMissing("attendance_records", "enrollment_id", "enrollment_id INT NULL AFTER attendance_session_id");
    await addColumnIfMissing("attendance_records", "check_in_time", "check_in_time DATETIME NULL AFTER status");

    if (await hasColumn("attendance_records", "session_id")) {
        await db.query(`
            UPDATE attendance_records
            SET attendance_session_id = COALESCE(attendance_session_id, session_id)
        `);

        await db.query("ALTER TABLE attendance_records MODIFY COLUMN session_id INT NULL");
    }

    if (await hasColumn("attendance_records", "checked_at")) {
        await db.query(`
            UPDATE attendance_records
            SET check_in_time = COALESCE(check_in_time, checked_at)
        `);
    }

    await db.query(`
        UPDATE attendance_records ar
        INNER JOIN attendance_sessions s ON s.id = ar.attendance_session_id
        INNER JOIN enrollments e
            ON e.course_section_id = s.course_section_id
           AND e.student_id = ar.student_id
        SET ar.enrollment_id = COALESCE(ar.enrollment_id, e.id)
    `);

    if (!(await hasIndex("attendance_records", "idx_attendance_records_session"))) {
        await db.query("CREATE INDEX idx_attendance_records_session ON attendance_records(attendance_session_id)");
    }

    if (!(await hasIndex("attendance_records", "idx_attendance_records_enrollment"))) {
        await db.query("CREATE INDEX idx_attendance_records_enrollment ON attendance_records(enrollment_id)");
    }
};

async function run() {
    await ensureAttendanceSessions();
    await ensureAttendanceRecords();

    console.log("Attendance schema ensured successfully.");
    await db.end();
}

run().catch(async (error) => {
    console.error("Failed to ensure attendance schema:", error.message);
    try {
        await db.end();
    } catch (_) {
        // Ignore shutdown errors.
    }
    process.exit(1);
});
