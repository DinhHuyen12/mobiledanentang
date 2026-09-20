const db = require("../config/db");

const isAdminUser = (user) => Number(user?.role_id || user?.role) === 1;
const isLecturerUser = (user) => Number(user?.role_id || user?.role) === 2;
const isStudentUser = (user) => Number(user?.role_id || user?.role) === 3;

const buildSelect = () => `
    SELECT
        da.id,
        da.student_id,
        u.full_name AS student_name,
        u.email AS student_email,
        si.class_id,
        c.name AS class_name,
        da.semester_id,
        sem.name AS semester_name,
        da.title,
        da.description,
        da.level,
        da.decision_date,
        da.status,
        da.decided_by,
        approver.full_name AS decided_by_name
    FROM disciplinary_actions da
    INNER JOIN student_info si ON da.student_id = si.id
    INNER JOIN users u ON si.user_id = u.id
    LEFT JOIN classes c ON si.class_id = c.id
    LEFT JOIN semesters sem ON da.semester_id = sem.id
    LEFT JOIN users approver ON da.decided_by = approver.id
`;

const disciplinaryActionsModel = {
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

    userExists: async (userId) => {
        if (!userId) {
            return true;
        }

        const [rows] = await db.query(
            `SELECT id
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [userId]
        );
        return Boolean(rows[0]);
    },

    getAllForUser: async (user) => {
        if (isAdminUser(user)) {
            const [rows] = await db.query(`
                ${buildSelect()}
                ORDER BY da.decision_date DESC, da.id DESC
            `);
            return rows;
        }

        if (isStudentUser(user)) {
            const [rows] = await db.query(
                `${buildSelect()}
                 WHERE si.user_id = ?
                 ORDER BY da.decision_date DESC, da.id DESC`,
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
                `${buildSelect()}
                 WHERE EXISTS (
                     SELECT 1
                     FROM enrollments e
                     INNER JOIN course_sections cs ON e.course_section_id = cs.id
                     WHERE e.student_id = si.id
                       AND cs.lecturer_id = ?
                 )
                 ORDER BY da.decision_date DESC, da.id DESC`,
                [lecturerRows[0].id]
            );
            return rows;
        }

        return [];
    },

    getByIdForUser: async (id, user) => {
        const rows = await disciplinaryActionsModel.getAllForUser(user);
        return rows.find((item) => Number(item.id) === Number(id)) || null;
    },

    create: async (data) => {
        const [result] = await db.query(
            `INSERT INTO disciplinary_actions
             (student_id, semester_id, title, description, level, decision_date, status, decided_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.student_id,
                data.semester_id || null,
                data.title,
                data.description || null,
                data.level,
                data.decision_date,
                data.status,
                data.decided_by || null
            ]
        );

        return result;
    },

    update: async (id, data) => {
        const [result] = await db.query(
            `UPDATE disciplinary_actions
             SET student_id = ?, semester_id = ?, title = ?, description = ?, level = ?, decision_date = ?, status = ?, decided_by = ?
             WHERE id = ?`,
            [
                data.student_id,
                data.semester_id || null,
                data.title,
                data.description || null,
                data.level,
                data.decision_date,
                data.status,
                data.decided_by || null,
                id
            ]
        );

        return result;
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM disciplinary_actions WHERE id = ?",
            [id]
        );

        return result;
    }
};

module.exports = disciplinaryActionsModel;
