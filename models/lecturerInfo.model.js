const db = require("../config/db");

const lecturerInfoModel = {
    getAll: async () => {
        const [rows] = await db.query(`
            SELECT 
                li.id,
                li.user_id,
                u.username,
                u.email,
                u.full_name,
                li.lecturer_code,
                li.academic_rank,
                li.specialization
            FROM lecturer_info li
            LEFT JOIN users u ON li.user_id = u.id
            ORDER BY li.id ASC
        `);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query(`
            SELECT 
                li.id,
                li.user_id,
                u.username,
                u.email,
                u.full_name,
                li.lecturer_code,
                li.academic_rank,
                li.specialization
            FROM lecturer_info li
            LEFT JOIN users u ON li.user_id = u.id
            WHERE li.id = ?
        `, [id]);

        return rows[0];
    },

    create: async (data) => {
        const { user_id, lecturer_code, academic_rank, specialization } = data;

        const [result] = await db.query(
            `INSERT INTO lecturer_info (user_id, lecturer_code, academic_rank, specialization)
             VALUES (?, ?, ?, ?)`,
            [user_id, lecturer_code, academic_rank, specialization]
        );

        return result;
    },

    update: async (id, data) => {
        const { user_id, lecturer_code, academic_rank, specialization } = data;

        const [result] = await db.query(
            `UPDATE lecturer_info
             SET user_id = ?, lecturer_code = ?, academic_rank = ?, specialization = ?
             WHERE id = ?`,
            [user_id, lecturer_code, academic_rank, specialization, id]
        );

        return result;
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM lecturer_info WHERE id = ?",
            [id]
        );

        return result;
    }
};

module.exports = lecturerInfoModel;