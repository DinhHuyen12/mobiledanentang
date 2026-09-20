const db = require("../config/db");

const isAdminUser = (user) => Number(user?.role_id || user?.role) === 1;
const isLecturerUser = (user) => Number(user?.role_id || user?.role) === 2;
const isStudentUser = (user) => Number(user?.role_id || user?.role) === 3;

const buildSelect = () => `
    SELECT
        ssr.id,
        ssr.student_id,
        u.full_name AS student_name,
        u.email AS student_email,
        si.class_id AS current_class_id,
        current_class.name AS current_class_name,
        ssr.record_type,
        ssr.from_class_id,
        from_class.name AS from_class_name,
        ssr.to_class_id,
        to_class.name AS to_class_name,
        ssr.effective_date,
        ssr.end_date,
        ssr.reason,
        ssr.decision_no,
        ssr.status,
        ssr.approved_by,
        approver.full_name AS approved_by_name,
        ssr.created_at,
        ssr.updated_at
    FROM student_status_records ssr
    INNER JOIN student_info si ON ssr.student_id = si.id
    INNER JOIN users u ON si.user_id = u.id
    LEFT JOIN classes current_class ON si.class_id = current_class.id
    LEFT JOIN classes from_class ON ssr.from_class_id = from_class.id
    LEFT JOIN classes to_class ON ssr.to_class_id = to_class.id
    LEFT JOIN users approver ON ssr.approved_by = approver.id
`;

const applyApprovedStatusEffect = async (connection, data) => {
    if (String(data.status).toLowerCase() !== "approved") {
        return;
    }

    if (data.record_type === "chuyen_lop" && data.to_class_id) {
        await connection.query(
            `UPDATE student_info
             SET class_id = ?, status = 'active'
             WHERE id = ?`,
            [data.to_class_id, data.student_id]
        );
        return;
    }

    if (data.record_type === "bao_luu") {
        await connection.query(
            `UPDATE student_info
             SET status = 'bao_luu'
             WHERE id = ?`,
            [data.student_id]
        );
        return;
    }

    if (data.record_type === "nghi_hoc") {
        await connection.query(
            `UPDATE student_info
             SET status = 'nghi_hoc'
             WHERE id = ?`,
            [data.student_id]
        );
    }
};

const studentStatusRecordsModel = {
    getAllForUser: async (user) => {
        if (isAdminUser(user)) {
            const [rows] = await db.query(`
                ${buildSelect()}
                ORDER BY ssr.effective_date DESC, ssr.id DESC
            `);
            return rows;
        }

        if (isStudentUser(user)) {
            const [rows] = await db.query(
                `${buildSelect()}
                 WHERE si.user_id = ?
                 ORDER BY ssr.effective_date DESC, ssr.id DESC`,
                [user.id]
            );
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
                 WHERE EXISTS (
                     SELECT 1
                     FROM enrollments e
                     INNER JOIN course_sections cs ON e.course_section_id = cs.id
                     WHERE e.student_id = si.id
                       AND cs.lecturer_id = ?
                 )
                 ORDER BY ssr.effective_date DESC, ssr.id DESC`,
                [lecturerRows[0].id]
            );

            return rows;
        }

        return [];
    },

    getByIdForUser: async (id, user) => {
        if (isAdminUser(user)) {
            const [rows] = await db.query(
                `${buildSelect()}
                 WHERE ssr.id = ?`,
                [id]
            );
            return rows[0];
        }

        if (isStudentUser(user)) {
            const [rows] = await db.query(
                `${buildSelect()}
                 WHERE ssr.id = ?
                   AND si.user_id = ?`,
                [id, user.id]
            );
            return rows[0];
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
                return null;
            }

            const [rows] = await db.query(
                `${buildSelect()}
                 WHERE ssr.id = ?
                   AND EXISTS (
                       SELECT 1
                       FROM enrollments e
                       INNER JOIN course_sections cs ON e.course_section_id = cs.id
                       WHERE e.student_id = si.id
                         AND cs.lecturer_id = ?
                   )`,
                [id, lecturerRows[0].id]
            );
            return rows[0];
        }

        return null;
    },

    create: async (data) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `INSERT INTO student_status_records
                 (student_id, record_type, from_class_id, to_class_id, effective_date, end_date, reason, decision_no, status, approved_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.student_id,
                    data.record_type,
                    data.from_class_id || null,
                    data.to_class_id || null,
                    data.effective_date,
                    data.end_date || null,
                    data.reason || null,
                    data.decision_no || null,
                    data.status,
                    data.approved_by || null
                ]
            );

            await applyApprovedStatusEffect(connection, data);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    update: async (id, data) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `UPDATE student_status_records
                 SET student_id = ?, record_type = ?, from_class_id = ?, to_class_id = ?, effective_date = ?, end_date = ?, reason = ?, decision_no = ?, status = ?, approved_by = ?
                 WHERE id = ?`,
                [
                    data.student_id,
                    data.record_type,
                    data.from_class_id || null,
                    data.to_class_id || null,
                    data.effective_date,
                    data.end_date || null,
                    data.reason || null,
                    data.decision_no || null,
                    data.status,
                    data.approved_by || null,
                    id
                ]
            );

            if (result.affectedRows > 0) {
                await applyApprovedStatusEffect(connection, data);
            }

            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM student_status_records WHERE id = ?",
            [id]
        );

        return result;
    }
};

module.exports = studentStatusRecordsModel;
