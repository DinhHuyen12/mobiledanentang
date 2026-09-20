const db = require("../config/db");

const academicYearsModel = {
    getAll: async () => {
        const [rows] = await db.query(
            "SELECT * FROM academic_years ORDER BY id ASC"
        );
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query(
            "SELECT * FROM academic_years WHERE id = ?",
            [id]
        );
        return rows[0];
    },

    create: async (name) => {
        const [result] = await db.query(
            "INSERT INTO academic_years (name) VALUES (?)",
            [name]
        );
        return result;
    },

    update: async (id, name) => {
        const [result] = await db.query(
            "UPDATE academic_years SET name = ? WHERE id = ?",
            [name, id]
        );
        return result;
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM academic_years WHERE id = ?",
            [id]
        );
        return result;
    }
};

module.exports = academicYearsModel;