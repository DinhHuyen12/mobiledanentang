const db = require("../config/db");

const subjectPrerequisitesModel = {
    getAll: async () => {
        const [rows] = await db.query(`
            SELECT
                sp.subject_id,
                s1.subject_code AS subject_code,
                s1.name AS subject_name,
                sp.prerequisite_id,
                s2.subject_code AS prerequisite_code,
                s2.name AS prerequisite_name
            FROM subject_prerequisites sp
            LEFT JOIN subjects s1 ON sp.subject_id = s1.id
            LEFT JOIN subjects s2 ON sp.prerequisite_id = s2.id
            ORDER BY sp.subject_id ASC, sp.prerequisite_id ASC
        `);

        return rows;
    },

    getBySubjectId: async (subjectId) => {
        const [rows] = await db.query(`
            SELECT
                sp.subject_id,
                s1.subject_code AS subject_code,
                s1.name AS subject_name,
                sp.prerequisite_id,
                s2.subject_code AS prerequisite_code,
                s2.name AS prerequisite_name
            FROM subject_prerequisites sp
            LEFT JOIN subjects s1 ON sp.subject_id = s1.id
            LEFT JOIN subjects s2 ON sp.prerequisite_id = s2.id
            WHERE sp.subject_id = ?
            ORDER BY sp.prerequisite_id ASC
        `, [subjectId]);

        return rows;
    },

    create: async (data) => {
        const { subject_id, prerequisite_id } = data;

        const [result] = await db.query(
            `INSERT INTO subject_prerequisites (subject_id, prerequisite_id)
             VALUES (?, ?)`,
            [subject_id, prerequisite_id]
        );

        return result;
    },

    update: async (subjectId, prerequisiteId, data) => {
        const { subject_id, prerequisite_id } = data;

        const [result] = await db.query(
            `UPDATE subject_prerequisites
             SET subject_id = ?, prerequisite_id = ?
             WHERE subject_id = ? AND prerequisite_id = ?`,
            [subject_id, prerequisite_id, subjectId, prerequisiteId]
        );

        return result;
    },

    remove: async (subjectId, prerequisiteId) => {
        const [result] = await db.query(
            `DELETE FROM subject_prerequisites
             WHERE subject_id = ? AND prerequisite_id = ?`,
            [subjectId, prerequisiteId]
        );

        return result;
    }
};

module.exports = subjectPrerequisitesModel;
