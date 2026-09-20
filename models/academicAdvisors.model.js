const db = require("../config/db");

const isAdminUser = (user) => Number(user?.role_id || user?.role) === 1;
const isLecturerUser = (user) => Number(user?.role_id || user?.role) === 2;
const isStudentUser = (user) => Number(user?.role_id || user?.role) === 3;

const buildSelect = () => `
    SELECT
        aa.id,
        aa.lecturer_id,
        lecturer_user.full_name AS lecturer_name,
        lecturer_user.email AS lecturer_email,
        aa.class_id,
        c.name AS class_name,
        aa.student_id,
        student_user.full_name AS student_name,
        student_user.email AS student_email,
        aa.start_date,
        aa.end_date,
        aa.note,
        aa.status
    FROM academic_advisors aa
    INNER JOIN lecturer_info li ON aa.lecturer_id = li.id
    INNER JOIN users lecturer_user ON li.user_id = lecturer_user.id
    LEFT JOIN classes c ON aa.class_id = c.id
    LEFT JOIN student_info si ON aa.student_id = si.id
    LEFT JOIN users student_user ON si.user_id = student_user.id
`;

const academicAdvisorsModel = {
    getAllForUser: async (user) => {
        if (isAdminUser(user)) {
            const [rows] = await db.query(`
                ${buildSelect()}
                ORDER BY aa.start_date DESC, aa.id DESC
            `);
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
                 WHERE aa.lecturer_id = ?
                 ORDER BY aa.start_date DESC, aa.id DESC`,
                [lecturerRows[0].id]
            );
            return rows;
        }

        if (isStudentUser(user)) {
            const [studentRows] = await db.query(
                `SELECT id, class_id
                 FROM student_info
                 WHERE user_id = ?
                 LIMIT 1`,
                [user.id]
            );

            if (!studentRows[0]) {
                return [];
            }

            const [rows] = await db.query(
                `${buildSelect()}
                 WHERE aa.student_id = ?
                    OR (aa.student_id IS NULL AND aa.class_id = ?)
                 ORDER BY aa.start_date DESC, aa.id DESC`,
                [studentRows[0].id, studentRows[0].class_id]
            );
            return rows;
        }

        return [];
    },

    getByIdForUser: async (id, user) => {
        const rows = await academicAdvisorsModel.getAllForUser(user);
        return rows.find((item) => Number(item.id) === Number(id)) || null;
    },

    create: async (data) => {
        const [result] = await db.query(
            `INSERT INTO academic_advisors
             (lecturer_id, class_id, student_id, start_date, end_date, note, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                data.lecturer_id,
                data.class_id || null,
                data.student_id || null,
                data.start_date,
                data.end_date || null,
                data.note || null,
                data.status
            ]
        );

        return result;
    },

    update: async (id, data) => {
        const [result] = await db.query(
            `UPDATE academic_advisors
             SET lecturer_id = ?, class_id = ?, student_id = ?, start_date = ?, end_date = ?, note = ?, status = ?
             WHERE id = ?`,
            [
                data.lecturer_id,
                data.class_id || null,
                data.student_id || null,
                data.start_date,
                data.end_date || null,
                data.note || null,
                data.status,
                id
            ]
        );

        return result;
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM academic_advisors WHERE id = ?",
            [id]
        );

        return result;
    }
};

module.exports = academicAdvisorsModel;
