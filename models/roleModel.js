const db = require("../config/db");

const Role = {

    getAll: async () => {
        const [rows] = await db.query("SELECT * FROM roles");
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query(
            "SELECT * FROM roles WHERE id = ?",
            [id]
        );
        return rows[0];
    },

    create: async (data) => {
        const { name } = data;

        const [result] = await db.query(
            "INSERT INTO roles(name) VALUES(?)",
            [name]
        );

        return result;
    },

    update: async (id, data) => {
        const { name } = data;

        const [result] = await db.query(
            "UPDATE roles SET name=? WHERE id=?",
            [name, id]
        );

        return result;
    },

    delete: async (id) => {
        const [result] = await db.query(
            "DELETE FROM roles WHERE id=?",
            [id]
        );

        return result;
    }

};

module.exports = Role;