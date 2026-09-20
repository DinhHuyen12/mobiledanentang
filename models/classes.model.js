const db = require("../config/db");

const classModel = {
    getAll: async () => {
        const [rows] = await db.query(`
            SELECT 
                c.id,
                c.name,
                c.faculty_id,
                f.name AS faculty_name,
                c.academic_year_id,
                ay.name AS academic_year_name
            FROM classes c
            LEFT JOIN faculties f ON c.faculty_id = f.id
            LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
            ORDER BY c.id ASC
        `);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query(`
            SELECT 
                c.id,
                c.name,
                c.faculty_id,
                f.name AS faculty_name,
                c.academic_year_id,
                ay.name AS academic_year_name
            FROM classes c
            LEFT JOIN faculties f ON c.faculty_id = f.id
            LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
            WHERE c.id = ?
        `, [id]);

        return rows[0];
    },

    create: async (data) => {
        const { name, faculty_id, academic_year_id } = data;

        const [result] = await db.query(
            "INSERT INTO classes (name, faculty_id, academic_year_id) VALUES (?, ?, ?)",
            [name, faculty_id, academic_year_id]
        );

        return result;
    },

    update: async (id, data) => {
        const { name, faculty_id, academic_year_id } = data;

        const [result] = await db.query(
            "UPDATE classes SET name = ?, faculty_id = ?, academic_year_id = ? WHERE id = ?",
            [name, faculty_id, academic_year_id, id]
        );

        return result;
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM classes WHERE id = ?",
            [id]
        );

        return result;
    }
};

module.exports = classModel;