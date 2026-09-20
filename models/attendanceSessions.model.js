const db = require("../config/db");

const INACTIVE_ENROLLMENT_STATUSES = ["pending", "cancelled", "canceled", "dropped", "rejected"];

const buildInactiveStatusPlaceholders = () =>
    INACTIVE_ENROLLMENT_STATUSES.map(() => "?").join(", ");

const attendanceSessionsModel = {
    getStudentInfoByUserId: async (userId) => {
        const [rows] = await db.query(
            `SELECT id, user_id
             FROM student_info
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        return rows[0];
    },

    getLecturerInfoByUserId: async (userId) => {
        const [rows] = await db.query(
            `SELECT id, user_id
             FROM lecturer_info
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        return rows[0];
    },

    getCourseSectionById: async (courseSectionId) => {
        const [rows] = await db.query(
            `SELECT
                cs.id,
                cs.subject_id,
                cs.semester_id,
                cs.lecturer_id,
                s.name AS subject_name,
                sem.name AS semester_name
             FROM course_sections cs
             LEFT JOIN subjects s ON cs.subject_id = s.id
             LEFT JOIN semesters sem ON cs.semester_id = sem.id
             WHERE cs.id = ?
             LIMIT 1`,
            [courseSectionId]
        );

        return rows[0];
    },

    getScheduleById: async (scheduleId) => {
        const [rows] = await db.query(
            `SELECT id, course_section_id, day_of_week, start_time, end_time, room
             FROM schedules
             WHERE id = ?
             LIMIT 1`,
            [scheduleId]
        );

        return rows[0];
    },

    getSessionById: async (id) => {
        const [rows] = await db.query(
            `SELECT
                s.id,
                s.course_section_id,
                s.schedule_id,
                s.session_date,
                s.start_time,
                s.end_time,
                s.room,
                s.topic,
                s.status,
                s.created_by,
                s.created_at,
                s.updated_at,
                cs.subject_id,
                cs.semester_id,
                cs.lecturer_id,
                sub.name AS subject_name,
                sem.name AS semester_name,
                creator.full_name AS created_by_name
             FROM attendance_sessions s
             LEFT JOIN course_sections cs ON s.course_section_id = cs.id
             LEFT JOIN subjects sub ON cs.subject_id = sub.id
             LEFT JOIN semesters sem ON cs.semester_id = sem.id
             LEFT JOIN users creator ON s.created_by = creator.id
             WHERE s.id = ?
             LIMIT 1`,
            [id]
        );

        return rows[0];
    },

    getAllSessionsForUser: async (user, filters = {}) => {
        const roleId = Number(user?.role_id || user?.role);
        const params = [];
        const conditions = [];
        const baseQuery = `
            SELECT
                s.id,
                s.course_section_id,
                s.schedule_id,
                s.session_date,
                s.start_time,
                s.end_time,
                s.room,
                s.topic,
                s.status,
                s.created_by,
                s.created_at,
                s.updated_at,
                cs.subject_id,
                cs.semester_id,
                cs.lecturer_id,
                sub.name AS subject_name,
                sem.name AS semester_name,
                creator.full_name AS created_by_name
            FROM attendance_sessions s
            LEFT JOIN course_sections cs ON s.course_section_id = cs.id
            LEFT JOIN subjects sub ON cs.subject_id = sub.id
            LEFT JOIN semesters sem ON cs.semester_id = sem.id
            LEFT JOIN users creator ON s.created_by = creator.id
        `;

        if (filters.course_section_id) {
            conditions.push("s.course_section_id = ?");
            params.push(Number(filters.course_section_id));
        }

        if (filters.session_date) {
            conditions.push("s.session_date = ?");
            params.push(filters.session_date);
        }

        if (roleId === 2) {
            const lecturerInfo = await attendanceSessionsModel.getLecturerInfoByUserId(user.id);

            if (!lecturerInfo) {
                return [];
            }

            conditions.push("cs.lecturer_id = ?");
            params.push(lecturerInfo.id);
        }

        if (roleId === 3) {
            const studentInfo = await attendanceSessionsModel.getStudentInfoByUserId(user.id);

            if (!studentInfo) {
                return [];
            }

            conditions.push(`EXISTS (
                SELECT 1
                FROM enrollments e
                WHERE e.course_section_id = s.course_section_id
                  AND e.student_id = ?
                  AND LOWER(COALESCE(e.status, 'active')) NOT IN (${buildInactiveStatusPlaceholders()})
            )`);
            params.push(studentInfo.id, ...INACTIVE_ENROLLMENT_STATUSES);
        }

        const query = `
            ${baseQuery}
            ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
            ORDER BY s.session_date DESC, s.start_time DESC, s.id DESC
        `;

        const [rows] = await db.query(query, params);
        return rows;
    },

    getSessionByIdForUser: async (id, user) => {
        const session = await attendanceSessionsModel.getSessionById(id);

        if (!session) {
            return null;
        }

        const roleId = Number(user?.role_id || user?.role);

        if (roleId === 1) {
            return session;
        }

        if (roleId === 2) {
            const lecturerInfo = await attendanceSessionsModel.getLecturerInfoByUserId(user.id);

            if (!lecturerInfo || Number(session.lecturer_id) !== Number(lecturerInfo.id)) {
                return null;
            }

            return session;
        }

        if (roleId === 3) {
            const studentInfo = await attendanceSessionsModel.getStudentInfoByUserId(user.id);

            if (!studentInfo) {
                return null;
            }

            const [rows] = await db.query(
                `SELECT e.id
                 FROM enrollments e
                 WHERE e.course_section_id = ?
                   AND e.student_id = ?
                   AND LOWER(COALESCE(e.status, 'active')) NOT IN (${buildInactiveStatusPlaceholders()})
                 LIMIT 1`,
                [session.course_section_id, studentInfo.id, ...INACTIVE_ENROLLMENT_STATUSES]
            );

            return rows[0] ? session : null;
        }

        return null;
    },

    create: async (data) => {
        const {
            course_section_id,
            schedule_id,
            session_date,
            start_time,
            end_time,
            room,
            topic,
            status,
            created_by
        } = data;

        const [result] = await db.query(
            `INSERT INTO attendance_sessions
             (course_section_id, schedule_id, session_date, start_time, end_time, room, topic, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                course_section_id,
                schedule_id || null,
                session_date,
                start_time || null,
                end_time || null,
                room || null,
                topic || null,
                status || "open",
                created_by || null
            ]
        );

        return result;
    },

    update: async (id, data) => {
        const {
            course_section_id,
            schedule_id,
            session_date,
            start_time,
            end_time,
            room,
            topic,
            status
        } = data;

        const [result] = await db.query(
            `UPDATE attendance_sessions
             SET course_section_id = ?, schedule_id = ?, session_date = ?, start_time = ?, end_time = ?, room = ?, topic = ?, status = ?
             WHERE id = ?`,
            [
                course_section_id,
                schedule_id || null,
                session_date,
                start_time || null,
                end_time || null,
                room || null,
                topic || null,
                status || "open",
                id
            ]
        );

        return result;
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM attendance_sessions WHERE id = ?",
            [id]
        );

        return result;
    },

    getSessionRoster: async (sessionId) => {
        const session = await attendanceSessionsModel.getSessionById(sessionId);

        if (!session) {
            return null;
        }

        const [rows] = await db.query(
            `SELECT
                e.id AS enrollment_id,
                e.student_id,
                si.user_id,
                u.full_name AS student_name,
                u.email AS student_email,
                e.status AS enrollment_status,
                ar.id AS attendance_record_id,
                ar.status,
                ar.check_in_time,
                ar.note,
                ar.created_at,
                ar.updated_at
             FROM enrollments e
             INNER JOIN student_info si ON e.student_id = si.id
             INNER JOIN users u ON si.user_id = u.id
             LEFT JOIN attendance_records ar
                ON ar.attendance_session_id = ?
               AND ar.enrollment_id = e.id
             WHERE e.course_section_id = ?
               AND LOWER(COALESCE(e.status, 'active')) NOT IN (${buildInactiveStatusPlaceholders()})
             ORDER BY u.full_name ASC, e.id ASC`,
            [sessionId, session.course_section_id, ...INACTIVE_ENROLLMENT_STATUSES]
        );

        return {
            session,
            records: rows
        };
    },

    getSessionRosterForUser: async (sessionId, user) => {
        const roleId = Number(user?.role_id || user?.role);
        const roster = await attendanceSessionsModel.getSessionRoster(sessionId);

        if (!roster) {
            return null;
        }

        if (roleId === 1) {
            return roster;
        }

        if (roleId === 2) {
            const lecturerInfo = await attendanceSessionsModel.getLecturerInfoByUserId(user.id);

            if (!lecturerInfo || Number(roster.session.lecturer_id) !== Number(lecturerInfo.id)) {
                return null;
            }

            return roster;
        }

        if (roleId === 3) {
            const studentInfo = await attendanceSessionsModel.getStudentInfoByUserId(user.id);

            if (!studentInfo) {
                return null;
            }

            return {
                session: roster.session,
                records: roster.records.filter((record) => Number(record.student_id) === Number(studentInfo.id))
            };
        }

        return null;
    },

    upsertSessionRecords: async (sessionId, records) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const session = await attendanceSessionsModel.getSessionById(sessionId);

            if (!session) {
                const error = new Error("Khong tim thay buoi diem danh");
                error.statusCode = 404;
                throw error;
            }

            const [enrollmentRows] = await connection.query(
                `SELECT e.id, e.student_id
                 FROM enrollments e
                 WHERE e.course_section_id = ?
                   AND LOWER(COALESCE(e.status, 'active')) NOT IN (${buildInactiveStatusPlaceholders()})`,
                [session.course_section_id, ...INACTIVE_ENROLLMENT_STATUSES]
            );

            const enrollmentMap = new Map(
                enrollmentRows.map((row) => [Number(row.id), row])
            );

            for (const record of records) {
                const enrollmentId = Number(record.enrollment_id);
                const enrollment = enrollmentMap.get(enrollmentId);

                if (!enrollment) {
                    const error = new Error(`Enrollment ${record.enrollment_id} khong thuoc buoi diem danh nay`);
                    error.statusCode = 400;
                    throw error;
                }

                if (
                    record.student_id != null &&
                    Number(record.student_id) !== Number(enrollment.student_id)
                ) {
                    const error = new Error(`student_id khong khop voi enrollment_id ${record.enrollment_id}`);
                    error.statusCode = 400;
                    throw error;
                }

                await connection.query(
                    `INSERT INTO attendance_records
                     (attendance_session_id, enrollment_id, student_id, status, check_in_time, note)
                     VALUES (?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        student_id = VALUES(student_id),
                        status = VALUES(status),
                        check_in_time = VALUES(check_in_time),
                        note = VALUES(note),
                        updated_at = CURRENT_TIMESTAMP`,
                    [
                        sessionId,
                        enrollmentId,
                        enrollment.student_id,
                        record.status || "present",
                        record.check_in_time || null,
                        record.note || null
                    ]
                );
            }

            await connection.commit();

            return attendanceSessionsModel.getSessionRoster(sessionId);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = attendanceSessionsModel;
