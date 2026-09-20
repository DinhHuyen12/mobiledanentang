const fs = require("fs");
const path = require("path");
const db = require("../config/db");

const studentDocumentsModel = {
    getById: async (id) => {
        const [rows] = await db.query(
            `SELECT
                sd.id,
                sd.student_id,
                sd.document_type,
                sd.title,
                sd.note,
                sd.file_name,
                sd.original_name,
                sd.mime_type,
                sd.file_size,
                sd.file_path,
                sd.uploaded_by,
                sd.created_at,
                u.full_name AS uploaded_by_name
             FROM student_documents sd
             LEFT JOIN users u ON sd.uploaded_by = u.id
             WHERE sd.id = ?
             LIMIT 1`,
            [id]
        );

        return rows[0];
    },

    getAllByStudentId: async (studentId) => {
        const [rows] = await db.query(
            `SELECT
                sd.id,
                sd.student_id,
                sd.document_type,
                sd.title,
                sd.note,
                sd.file_name,
                sd.original_name,
                sd.mime_type,
                sd.file_size,
                sd.file_path,
                sd.uploaded_by,
                sd.created_at,
                u.full_name AS uploaded_by_name
             FROM student_documents sd
             LEFT JOIN users u ON sd.uploaded_by = u.id
             WHERE sd.student_id = ?
             ORDER BY sd.created_at DESC, sd.id DESC`,
            [studentId]
        );

        return rows;
    },

    createMany: async (documents) => {
        if (!documents.length) {
            return [];
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const createdIds = [];

            for (const document of documents) {
                const [result] = await connection.query(
                    `INSERT INTO student_documents
                     (student_id, document_type, title, note, file_name, original_name, mime_type, file_size, file_path, uploaded_by)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        document.student_id,
                        document.document_type,
                        document.title,
                        document.note,
                        document.file_name,
                        document.original_name,
                        document.mime_type,
                        document.file_size,
                        document.file_path,
                        document.uploaded_by
                    ]
                );

                createdIds.push(result.insertId);
            }

            await connection.commit();

            const [rows] = await db.query(
                `SELECT
                    sd.id,
                    sd.student_id,
                    sd.document_type,
                    sd.title,
                    sd.note,
                    sd.file_name,
                    sd.original_name,
                    sd.mime_type,
                    sd.file_size,
                    sd.file_path,
                    sd.uploaded_by,
                    sd.created_at,
                    u.full_name AS uploaded_by_name
                 FROM student_documents sd
                 LEFT JOIN users u ON sd.uploaded_by = u.id
                 WHERE sd.id IN (${createdIds.map(() => "?").join(", ")})
                 ORDER BY sd.id ASC`,
                createdIds
            );

            return rows;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    remove: async (id) => {
        const document = await studentDocumentsModel.getById(id);

        if (!document) {
            return null;
        }

        const [result] = await db.query(
            "DELETE FROM student_documents WHERE id = ?",
            [id]
        );

        if (result.affectedRows > 0 && document.file_path) {
            const absolutePath = path.join(__dirname, "..", document.file_path);

            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
            }
        }

        return document;
    }
};

module.exports = studentDocumentsModel;
