const db = require("../config/db");

const Faculty = {

    getAll: async () => {
        const [rows] = await db.query("SELECT * FROM faculties");
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query(
            "SELECT * FROM faculties WHERE id = ?",
            [id]
        );
        return rows[0];
    },

    create: async (data) => {
        const { name } = data;

        const [result] = await db.query(
            "INSERT INTO faculties(name) VALUES(?)",
            [name]
        );

        return result;
    },

    update: async (id, data) => {
        const { name } = data;

        const [result] = await db.query(
            "UPDATE faculties SET name=? WHERE id=?",
            [name, id]
        );

        return result;
    },

    delete: async (id) => {
        const [result] = await db.query(
            "DELETE FROM faculties WHERE id=?",
            [id]
        );

        return result;
    }

};

module.exports = Faculty;