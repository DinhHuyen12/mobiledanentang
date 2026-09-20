const db = require("../config/db");

const isAdminUser = (user) => Number(user?.role_id || user?.role) === 1;
const isLecturerUser = (user) => Number(user?.role_id || user?.role) === 2;
const isStudentUser = (user) => Number(user?.role_id || user?.role) === 3;

const scholarshipsModel = {
    studentExists: async (studentId) => {
        const [rows] = await db.query(
            `SELECT id
             FROM student_info
             WHERE id = ?
             LIMIT 1`,
            [studentId]
        );
        return Boolean(rows[0]);
    },

    semesterExists: async (semesterId) => {
        if (!semesterId) {
            return true;
        }

        const [rows] = await db.query(
            `SELECT id
             FROM semesters
             WHERE id = ?
             LIMIT 1`,
            [semesterId]
        );
        return Boolean(rows[0]);
    },

    awardConflictExists: async (scholarshipId, studentId, excludeId = null) => {
        const params = [scholarshipId, studentId];
        let query = `
            SELECT id
            FROM student_scholarships
            WHERE scholarship_id = ?
              AND student_id = ?
        `;

        if (excludeId) {
            query += " AND id <> ?";
            params.push(Number(excludeId));
        }

        query += " LIMIT 1";
        const [rows] = await db.query(query, params);
        return Boolean(rows[0]);
    },

    getAll: async () => {
        const [rows] = await db.query(
            `SELECT
                s.id,
                s.name,
                s.description,
                s.amount,
                s.semester_id,
                sem.name AS semester_name,
                s.min_gpa,
                s.status
             FROM scholarships s
             LEFT JOIN semesters sem ON s.semester_id = sem.id
             ORDER BY s.id ASC`
        );

        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query(
            `SELECT
                s.id,
                s.name,
                s.description,
                s.amount,
                s.semester_id,
                sem.name AS semester_name,
                s.min_gpa,
                s.status
             FROM scholarships s
             LEFT JOIN semesters sem ON s.semester_id = sem.id
             WHERE s.id = ?`,
            [id]
        );

        return rows[0];
    },

    getAwardRowsForUser: async (user) => {
        if (isAdminUser(user)) {
            const [rows] = await db.query(
                `SELECT
                    ss.id,
                    ss.scholarship_id,
                    s.name AS scholarship_name,
                    s.amount,
                    ss.student_id,
                    u.full_name AS student_name,
                    u.email AS student_email,
                    ss.awarded_date,
                    ss.note,
                    ss.status
                 FROM student_scholarships ss
                 INNER JOIN scholarships s ON ss.scholarship_id = s.id
                 INNER JOIN student_info si ON ss.student_id = si.id
                 INNER JOIN users u ON si.user_id = u.id
                 ORDER BY ss.awarded_date DESC, ss.id DESC`
            );
            return rows;
        }

        if (isStudentUser(user)) {
            const [rows] = await db.query(
                `SELECT
                    ss.id,
                    ss.scholarship_id,
                    s.name AS scholarship_name,
                    s.amount,
                    ss.student_id,
                    u.full_name AS student_name,
                    u.email AS student_email,
                    ss.awarded_date,
                    ss.note,
                    ss.status
                 FROM student_scholarships ss
                 INNER JOIN scholarships s ON ss.scholarship_id = s.id
                 INNER JOIN student_info si ON ss.student_id = si.id
                 INNER JOIN users u ON si.user_id = u.id
                 WHERE si.user_id = ?
                 ORDER BY ss.awarded_date DESC, ss.id DESC`,
                [user.id]
            );
            return rows;
        }

        if (isLecturerUser(user)) {
            const [lecturerRows] = await db.query(
                `SELECT id
                 FROM lecturer_info
                 WHERE user_id = ?
                 LIMIT 1`,
                [user.id]
            );

            if (!lecturerRows[0]) {
                return [];
            }

            const [rows] = await db.query(
                `SELECT
                    ss.id,
                    ss.scholarship_id,
                    s.name AS scholarship_name,
                    s.amount,
                    ss.student_id,
                    u.full_name AS student_name,
                    u.email AS student_email,
                    ss.awarded_date,
                    ss.note,
                    ss.status
                 FROM student_scholarships ss
                 INNER JOIN scholarships s ON ss.scholarship_id = s.id
                 INNER JOIN student_info si ON ss.student_id = si.id
                 INNER JOIN users u ON si.user_id = u.id
                 WHERE EXISTS (
                     SELECT 1
                     FROM enrollments e
                     INNER JOIN course_sections cs ON e.course_section_id = cs.id
                     WHERE e.student_id = si.id
                       AND cs.lecturer_id = ?
                 )
                 ORDER BY ss.awarded_date DESC, ss.id DESC`,
                [lecturerRows[0].id]
            );

            return rows;
        }

        return [];
    },

    create: async (data) => {
        const [result] = await db.query(
            `INSERT INTO scholarships
             (name, description, amount, semester_id, min_gpa, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                data.name,
                data.description || null,
                data.amount,
                data.semester_id || null,
                data.min_gpa || null,
                data.status
            ]
        );

        return result;
    },

    update: async (id, data) => {
        const [result] = await db.query(
            `UPDATE scholarships
             SET name = ?, description = ?, amount = ?, semester_id = ?, min_gpa = ?, status = ?
             WHERE id = ?`,
            [
                data.name,
                data.description || null,
                data.amount,
                data.semester_id || null,
                data.min_gpa || null,
                data.status,
                id
            ]
        );

        return result;
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM scholarships WHERE id = ?",
            [id]
        );

        return result;
    },

    awardScholarship: async (data) => {
        const [result] = await db.query(
            `INSERT INTO student_scholarships
             (scholarship_id, student_id, awarded_date, note, status)
             VALUES (?, ?, ?, ?, ?)`,
            [
                data.scholarship_id,
                data.student_id,
                data.awarded_date,
                data.note || null,
                data.status
            ]
        );

        return result;
    },

    updateAward: async (id, data) => {
        const [result] = await db.query(
            `UPDATE student_scholarships
             SET scholarship_id = ?, student_id = ?, awarded_date = ?, note = ?, status = ?
             WHERE id = ?`,
            [
                data.scholarship_id,
                data.student_id,
                data.awarded_date,
                data.note || null,
                data.status,
                id
            ]
        );

        return result;
    },

    removeAward: async (id) => {
        const [result] = await db.query(
            "DELETE FROM student_scholarships WHERE id = ?",
            [id]
        );

        return result;
    }
};

module.exports = scholarshipsModel;
