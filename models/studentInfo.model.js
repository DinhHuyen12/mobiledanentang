const bcrypt = require("bcryptjs");
const db = require("../config/db");

const isAdminUser = (user) => Number(user?.role_id || user?.role) === 1;
const isLecturerUser = (user) => Number(user?.role_id || user?.role) === 2;
const isStudentUser = (user) => Number(user?.role_id || user?.role) === 3;

const STUDENT_STATUSES = [
    { value: "active", label: "Dang hoc" },
    { value: "bao_luu", label: "Bao luu" },
    { value: "nghi_hoc", label: "Nghi hoc" },
    { value: "tot_nghiep", label: "Tot nghiep" }
];

const STATUS_ALIASES = {
    active: "active",
    dang_hoc: "active",
    danghoc: "active",
    bao_luu: "bao_luu",
    baoluu: "bao_luu",
    nghi_hoc: "nghi_hoc",
    nghihoc: "nghi_hoc",
    tot_nghiep: "tot_nghiep",
    totnghiep: "tot_nghiep"
};

const normalizeStatusKey = (value) =>
    String(value || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

const normalizeStudentStatus = (value) => STATUS_ALIASES[normalizeStatusKey(value)] || null;

const getStudentStatusLabel = (value) => {
    const status = STUDENT_STATUSES.find((item) => item.value === value);
    return status ? status.label : value;
};

const buildStudentInfoSelect = () => `
    SELECT
        si.id,
        si.user_id,
        u.username,
        u.email,
        u.full_name,
        si.class_id,
        c.name AS class_name,
        si.enrollment_date,
        si.status
    FROM student_info si
    LEFT JOIN users u ON si.user_id = u.id
    LEFT JOIN classes c ON si.class_id = c.id
`;

const studentInfoModel = {
    STUDENT_STATUSES,
    normalizeStudentStatus,
    getStudentStatusLabel,

    getStudentInfoByUserId: async (userId) => {
        const [rows] = await db.query(
            `${buildStudentInfoSelect()}
             WHERE si.user_id = ?
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

    getAll: async () => {
        const [rows] = await db.query(`
            ${buildStudentInfoSelect()}
            ORDER BY si.id ASC
        `);

        return rows;
    },

    getAllForUser: async (user) => {
        if (isAdminUser(user)) {
            return studentInfoModel.getAll();
        }

        if (isStudentUser(user)) {
            const studentInfo = await studentInfoModel.getStudentInfoByUserId(user.id);
            return studentInfo ? [studentInfo] : [];
        }

        if (isLecturerUser(user)) {
            const lecturerInfo = await studentInfoModel.getLecturerInfoByUserId(user.id);

            if (!lecturerInfo) {
                return [];
            }

            const [rows] = await db.query(
                `${buildStudentInfoSelect()}
                 WHERE EXISTS (
                     SELECT 1
                     FROM enrollments e
                     INNER JOIN course_sections cs ON e.course_section_id = cs.id
                     WHERE e.student_id = si.id
                       AND cs.lecturer_id = ?
                 )
                 ORDER BY si.id ASC`,
                [lecturerInfo.id]
            );

            return rows;
        }

        return [];
    },

    getById: async (id) => {
        const [rows] = await db.query(
            `${buildStudentInfoSelect()}
             WHERE si.id = ?`,
            [id]
        );

        return rows[0];
    },

    getClassById: async (classId) => {
        const [rows] = await db.query(
            `SELECT id, name
             FROM classes
             WHERE id = ?
             LIMIT 1`,
            [classId]
        );

        return rows[0];
    },

    getByIdForUser: async (id, user) => {
        if (isAdminUser(user)) {
            return studentInfoModel.getById(id);
        }

        if (isStudentUser(user)) {
            const [rows] = await db.query(
                `${buildStudentInfoSelect()}
                 WHERE si.id = ? AND si.user_id = ?`,
                [id, user.id]
            );

            return rows[0];
        }

        if (isLecturerUser(user)) {
            const lecturerInfo = await studentInfoModel.getLecturerInfoByUserId(user.id);

            if (!lecturerInfo) {
                return null;
            }

            const [rows] = await db.query(
                `${buildStudentInfoSelect()}
                 WHERE si.id = ?
                   AND EXISTS (
                       SELECT 1
                       FROM enrollments e
                       INNER JOIN course_sections cs ON e.course_section_id = cs.id
                       WHERE e.student_id = si.id
                         AND cs.lecturer_id = ?
                   )`,
                [id, lecturerInfo.id]
            );

            return rows[0];
        }

        return null;
    },

    create: async (data) => {
        const { user_id, class_id, enrollment_date, status } = data;

        const [result] = await db.query(
            `INSERT INTO student_info (user_id, class_id, enrollment_date, status)
             VALUES (?, ?, ?, ?)`,
            [user_id, class_id, enrollment_date, status]
        );

        return result;
    },

    importStudents: async (rows) => {
        const connection = await db.getConnection();
        const summary = {
            total_rows: rows.length,
            inserted: 0,
            failed: 0,
            errors: []
        };

        const normalizeKey = (value) =>
            String(value || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9]/g, "")
                .toLowerCase();

        const pickValue = (row, acceptedKeys) => {
            const normalizedAcceptedKeys = acceptedKeys.map(normalizeKey);

            for (const [key, value] of Object.entries(row)) {
                if (normalizedAcceptedKeys.includes(normalizeKey(key))) {
                    return value;
                }
            }

            return "";
        };

        try {
            for (let index = 0; index < rows.length; index += 1) {
                const row = rows[index];
                const username = String(pickValue(row, ["username", "ma_sv", "masv", "student_code"])).trim();
                const email = String(pickValue(row, ["email"])).trim();
                const password = String(pickValue(row, ["password", "mat_khau", "matkhau"])).trim() || username;
                const fullName = String(pickValue(row, ["full_name", "fullname", "ho_ten", "hoten", "name"])).trim();
                const phone = String(pickValue(row, ["phone", "so_dien_thoai", "sdt"])).trim() || null;
                const classId = Number(pickValue(row, ["class_id", "lop_id", "classid"]));
                const enrollmentDate = String(
                    pickValue(row, ["enrollment_date", "ngay_nhap_hoc", "enrollmentdate"])
                ).trim() || new Date().toISOString().slice(0, 10);
                const status = String(pickValue(row, ["status", "trang_thai"])).trim() || "active";

                if (!username || !email || !fullName || !Number.isFinite(classId) || classId <= 0) {
                    summary.failed += 1;
                    summary.errors.push({
                        row: index + 2,
                        message: "Thieu username, email, full_name hoac class_id"
                    });
                    continue;
                }

                await connection.beginTransaction();

                try {
                    const [existingUserRows] = await connection.query(
                        `SELECT id
                         FROM users
                         WHERE username = ? OR email = ?
                         LIMIT 1`,
                        [username, email]
                    );

                    if (existingUserRows[0]) {
                        throw new Error("Username hoac email da ton tai");
                    }

                    const [classRows] = await connection.query(
                        `SELECT id
                         FROM classes
                         WHERE id = ?
                         LIMIT 1`,
                        [classId]
                    );

                    if (!classRows[0]) {
                        throw new Error("class_id khong ton tai");
                    }

                    const hashedPassword = await bcrypt.hash(password, 10);
                    const [userResult] = await connection.query(
                        `INSERT INTO users (username, email, password, full_name, phone, role_id)
                         VALUES (?, ?, ?, ?, ?, 3)`,
                        [username, email, hashedPassword, fullName, phone]
                    );

                    await connection.query(
                        `INSERT INTO student_info (user_id, class_id, enrollment_date, status)
                         VALUES (?, ?, ?, ?)`,
                        [userResult.insertId, classId, enrollmentDate, status]
                    );

                    await connection.commit();
                    summary.inserted += 1;
                } catch (error) {
                    await connection.rollback();
                    summary.failed += 1;
                    summary.errors.push({
                        row: index + 2,
                        username,
                        email,
                        message: error.message
                    });
                }
            }

            return summary;
        } finally {
            connection.release();
        }
    },

    update: async (id, data) => {
        const { user_id, class_id, enrollment_date, status } = data;

        const [result] = await db.query(
            `UPDATE student_info
             SET user_id = ?, class_id = ?, enrollment_date = ?, status = ?
             WHERE id = ?`,
            [user_id, class_id, enrollment_date, status, id]
        );

        return result;
    },

    updateStudentStatus: async (id, status, changedBy, options = {}) => {
        const connection = await db.getConnection();
        const normalizedStatus = normalizeStudentStatus(status);

        if (!normalizedStatus) {
            const error = new Error("Trang thai sinh vien khong hop le");
            error.statusCode = 400;
            throw error;
        }

        try {
            await connection.beginTransaction();

            const [studentRows] = await connection.query(
                `SELECT id, class_id, status
                 FROM student_info
                 WHERE id = ?
                 FOR UPDATE`,
                [id]
            );

            const student = studentRows[0];

            if (!student) {
                await connection.rollback();
                return null;
            }

            const [result] = await connection.query(
                `UPDATE student_info
                 SET status = ?
                 WHERE id = ?`,
                [normalizedStatus, id]
            );

            if (student.status !== normalizedStatus) {
                await connection.query(
                    `INSERT INTO student_status_records
                     (student_id, record_type, from_class_id, effective_date, reason, decision_no, status, approved_by)
                     VALUES (?, ?, ?, ?, ?, ?, 'approved', ?)`,
                    [
                        id,
                        normalizedStatus,
                        student.class_id || null,
                        options.effective_date || new Date().toISOString().slice(0, 10),
                        options.reason || null,
                        options.decision_no || null,
                        changedBy || null
                    ]
                );
            }

            await connection.commit();

            return {
                affectedRows: result.affectedRows,
                status: normalizedStatus,
                status_label: getStudentStatusLabel(normalizedStatus),
                previous_status: student.status,
                previous_status_label: getStudentStatusLabel(student.status)
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM student_info WHERE id = ?",
            [id]
        );

        return result;
    }
};

module.exports = studentInfoModel;
