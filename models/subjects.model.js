const db = require("../config/db");

exports.getAll = async () => {
    const [rows] = await db.query(`
        SELECT
            s.*,
            f.name AS faculty_name
        FROM subjects s
        LEFT JOIN faculties f ON s.faculty_id = f.id
        ORDER BY s.subject_code ASC
    `);
    return rows;
};

exports.getById = async (id) => {
    const [rows] = await db.query(
        `SELECT
            s.*,
            f.name AS faculty_name
         FROM subjects s
         LEFT JOIN faculties f ON s.faculty_id = f.id
         WHERE s.id = ?`,
        [id]
    );
    return rows[0];
};

exports.create = async (subject) => {
    const { subject_code, name, credits, faculty_id } = subject;

    const [result] = await db.query(
        "INSERT INTO subjects(subject_code, name, credits, faculty_id) VALUES (?,?,?,?)",
        [subject_code, name, credits, faculty_id]
    );

    return result;
};

exports.update = async (id, subject) => {
    const { subject_code, name, credits, faculty_id } = subject;

    const [result] = await db.query(
        "UPDATE subjects SET subject_code = ?, name = ?, credits = ?, faculty_id = ? WHERE id = ?",
        [subject_code, name, credits, faculty_id, id]
    );

    return result;
};

exports.delete = async (id) => {
    const [result] = await db.query(
        "DELETE FROM subjects WHERE id = ?",
        [id]
    );

    return result;
};
