const db = require("../config/db");

const semesterModel = {
    getAll: async () => {
        const [rows] = await db.query(`
            SELECT 
                s.id,
                s.name,
                s.academic_year_id,
                ay.name AS academic_year_name
            FROM semesters s
            LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
            ORDER BY s.id ASC
        `);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query(`
            SELECT 
                s.id,
                s.name,
                s.academic_year_id,
                ay.name AS academic_year_name
            FROM semesters s
            LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
            WHERE s.id = ?
        `, [id]);

        return rows[0];
    },

    create: async (data) => {
        const { name, academic_year_id } = data;

        const [result] = await db.query(
            "INSERT INTO semesters (name, academic_year_id) VALUES (?, ?)",
            [name, academic_year_id]
        );

        return result;
    },

    update: async (id, data) => {
        const { name, academic_year_id } = data;

        const [result] = await db.query(
            "UPDATE semesters SET name = ?, academic_year_id = ? WHERE id = ?",
            [name, academic_year_id, id]
        );

        return result;
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM semesters WHERE id = ?",
            [id]
        );

        return result;
    }
};

module.exports = semesterModel;