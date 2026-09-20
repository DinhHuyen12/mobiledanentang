const db = require("../config/db");
const tuitionsModel = require("./tuitions.model");
const { isOneOf, isValidDateString, PAYMENT_METHODS } = require("../utils/validation");

const tuitionPaymentsModel = {
    getStudentInfoByUserId: async (userId) => {
        const [rows] = await db.query(
            `SELECT id, user_id
             FROM student_info
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        return rows[0];
    },

    getAll: async () => {
        const [rows] = await db.query(`
            SELECT
                tp.id,
                tp.tuition_id,
                t.student_id,
                si.user_id,
                u.full_name AS student_name,
                u.email AS student_email,
                t.semester_id,
                sem.name AS semester_name,
                tp.payment_date,
                tp.amount,
                tp.payment_method,
                tp.note,
                tp.created_at
            FROM tuition_payments tp
            LEFT JOIN tuitions t ON tp.tuition_id = t.id
            LEFT JOIN student_info si ON t.student_id = si.id
            LEFT JOIN users u ON si.user_id = u.id
            LEFT JOIN semesters sem ON t.semester_id = sem.id
            ORDER BY tp.id ASC
        `);

        return rows;
    },

    getAllForUser: async (user) => {
        const roleId = Number(user?.role_id || user?.role);

        if (roleId === 1) {
            return tuitionPaymentsModel.getAll();
        }

        if (roleId === 3) {
            const studentInfo = await tuitionPaymentsModel.getStudentInfoByUserId(user.id);

            if (!studentInfo) {
                return [];
            }

            const [rows] = await db.query(
                `
                SELECT
                    tp.id,
                    tp.tuition_id,
                    t.student_id,
                    si.user_id,
                    u.full_name AS student_name,
                    u.email AS student_email,
                    t.semester_id,
                    sem.name AS semester_name,
                    tp.payment_date,
                    tp.amount,
                    tp.payment_method,
                    tp.note,
                    tp.created_at
                FROM tuition_payments tp
                LEFT JOIN tuitions t ON tp.tuition_id = t.id
                LEFT JOIN student_info si ON t.student_id = si.id
                LEFT JOIN users u ON si.user_id = u.id
                LEFT JOIN semesters sem ON t.semester_id = sem.id
                WHERE t.student_id = ?
                ORDER BY tp.id ASC
                `,
                [studentInfo.id]
            );

            return rows;
        }

        return [];
    },

    getById: async (id) => {
        const [rows] = await db.query(`
            SELECT
                tp.id,
                tp.tuition_id,
                t.student_id,
                si.user_id,
                u.full_name AS student_name,
                u.email AS student_email,
                t.semester_id,
                sem.name AS semester_name,
                tp.payment_date,
                tp.amount,
                tp.payment_method,
                tp.note,
                tp.created_at
            FROM tuition_payments tp
            LEFT JOIN tuitions t ON tp.tuition_id = t.id
            LEFT JOIN student_info si ON t.student_id = si.id
            LEFT JOIN users u ON si.user_id = u.id
            LEFT JOIN semesters sem ON t.semester_id = sem.id
            WHERE tp.id = ?
        `, [id]);

        return rows[0];
    },

    getByIdForUser: async (id, user) => {
        const roleId = Number(user?.role_id || user?.role);

        if (roleId === 1) {
            return tuitionPaymentsModel.getById(id);
        }

        if (roleId === 3) {
            const studentInfo = await tuitionPaymentsModel.getStudentInfoByUserId(user.id);

            if (!studentInfo) {
                return null;
            }

            const [rows] = await db.query(
                `
                SELECT
                    tp.id,
                    tp.tuition_id,
                    t.student_id,
                    si.user_id,
                    u.full_name AS student_name,
                    u.email AS student_email,
                    t.semester_id,
                    sem.name AS semester_name,
                    tp.payment_date,
                    tp.amount,
                    tp.payment_method,
                    tp.note,
                    tp.created_at
                FROM tuition_payments tp
                LEFT JOIN tuitions t ON tp.tuition_id = t.id
                LEFT JOIN student_info si ON t.student_id = si.id
                LEFT JOIN users u ON si.user_id = u.id
                LEFT JOIN semesters sem ON t.semester_id = sem.id
                WHERE tp.id = ? AND t.student_id = ?
                `,
                [id, studentInfo.id]
            );

            return rows[0];
        }

        return null;
    },

    getByTuitionIdForUser: async (tuitionId, user) => {
        const roleId = Number(user?.role_id || user?.role);

        if (roleId === 1) {
            const [rows] = await db.query(
                `
                SELECT
                    tp.id,
                    tp.tuition_id,
                    t.student_id,
                    si.user_id,
                    u.full_name AS student_name,
                    u.email AS student_email,
                    t.semester_id,
                    sem.name AS semester_name,
                    tp.payment_date,
                    tp.amount,
                    tp.payment_method,
                    tp.note,
                    tp.created_at
                FROM tuition_payments tp
                LEFT JOIN tuitions t ON tp.tuition_id = t.id
                LEFT JOIN student_info si ON t.student_id = si.id
                LEFT JOIN users u ON si.user_id = u.id
                LEFT JOIN semesters sem ON t.semester_id = sem.id
                WHERE tp.tuition_id = ?
                ORDER BY tp.payment_date DESC, tp.id DESC
                `,
                [tuitionId]
            );

            return rows;
        }

        if (roleId === 3) {
            const studentInfo = await tuitionPaymentsModel.getStudentInfoByUserId(user.id);

            if (!studentInfo) {
                return [];
            }

            const [rows] = await db.query(
                `
                SELECT
                    tp.id,
                    tp.tuition_id,
                    t.student_id,
                    si.user_id,
                    u.full_name AS student_name,
                    u.email AS student_email,
                    t.semester_id,
                    sem.name AS semester_name,
                    tp.payment_date,
                    tp.amount,
                    tp.payment_method,
                    tp.note,
                    tp.created_at
                FROM tuition_payments tp
                LEFT JOIN tuitions t ON tp.tuition_id = t.id
                LEFT JOIN student_info si ON t.student_id = si.id
                LEFT JOIN users u ON si.user_id = u.id
                LEFT JOIN semesters sem ON t.semester_id = sem.id
                WHERE tp.tuition_id = ? AND t.student_id = ?
                ORDER BY tp.payment_date DESC, tp.id DESC
                `,
                [tuitionId, studentInfo.id]
            );

            return rows;
        }

        return [];
    },

    findByVnpTxnRef: async (txnRef, connection = db) => {
        const [rows] = await connection.query(
            `SELECT id, tuition_id, payment_date, amount, payment_method, note
             FROM tuition_payments
             WHERE note LIKE ?
             ORDER BY id DESC
             LIMIT 1`,
            [`%VNPAY_TXN_REF:${txnRef}%`]
        );

        return rows[0];
    },

    validatePaymentPayload: async (data, excludePaymentId = null, connection = db) => {
        const { tuition_id, amount } = data;
        const tuition = await tuitionsModel.getRawById(tuition_id, connection);

        if (!tuition) {
            return {
                ok: false,
                code: 404,
                message: "Khong tim thay hoc phi"
            };
        }

        const normalizedAmount = Number(amount);

        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            return {
                ok: false,
                code: 400,
                message: "So tien thanh toan phai lon hon 0"
            };
        }

        if (!isValidDateString(data.payment_date)) {
            return {
                ok: false,
                code: 400,
                message: "payment_date khong hop le, can theo dinh dang YYYY-MM-DD"
            };
        }

        if (data.payment_method && !isOneOf(data.payment_method, PAYMENT_METHODS)) {
            return {
                ok: false,
                code: 400,
                message: "payment_method khong hop le"
            };
        }

        const params = [tuition_id];
        let query = `
            SELECT COALESCE(SUM(amount), 0) AS paid_amount
            FROM tuition_payments
            WHERE tuition_id = ?
        `;

        if (excludePaymentId) {
            query += " AND id <> ?";
            params.push(excludePaymentId);
        }

        const [paymentRows] = await connection.query(query, params);
        const currentPaidAmount = Number(paymentRows[0]?.paid_amount || 0);

        if (currentPaidAmount + normalizedAmount > Number(tuition.amount)) {
            return {
                ok: false,
                code: 409,
                message: "So tien thanh toan vuot qua tong hoc phi"
            };
        }

        return {
            ok: true,
            tuition
        };
    },

    create: async (data) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const validation = await tuitionPaymentsModel.validatePaymentPayload(data, null, connection);

            if (!validation.ok) {
                const error = new Error(validation.message);
                error.statusCode = validation.code;
                throw error;
            }

            const { tuition_id, payment_date, amount, payment_method, note } = data;

            const [result] = await connection.query(
                `INSERT INTO tuition_payments
                 (tuition_id, payment_date, amount, payment_method, note)
                 VALUES (?, ?, ?, ?, ?)`,
                [tuition_id, payment_date, amount, payment_method || null, note || null]
            );

            await tuitionsModel.updatePaidAmountAndStatus(tuition_id, connection);
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

            const existingPayment = await tuitionPaymentsModel.getRawById(id, connection);

            if (!existingPayment) {
                const error = new Error("Khong tim thay thanh toan hoc phi");
                error.statusCode = 404;
                throw error;
            }

            const validation = await tuitionPaymentsModel.validatePaymentPayload(data, id, connection);

            if (!validation.ok) {
                const error = new Error(validation.message);
                error.statusCode = validation.code;
                throw error;
            }

            const { tuition_id, payment_date, amount, payment_method, note } = data;

            const [result] = await connection.query(
                `UPDATE tuition_payments
                 SET tuition_id = ?, payment_date = ?, amount = ?, payment_method = ?, note = ?
                 WHERE id = ?`,
                [tuition_id, payment_date, amount, payment_method || null, note || null, id]
            );

            await tuitionsModel.updatePaidAmountAndStatus(existingPayment.tuition_id, connection);

            if (Number(existingPayment.tuition_id) !== Number(tuition_id)) {
                await tuitionsModel.updatePaidAmountAndStatus(tuition_id, connection);
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

    getRawById: async (id, connection = db) => {
        const [rows] = await connection.query(
            `SELECT id, tuition_id, payment_date, amount, payment_method, note
             FROM tuition_payments
             WHERE id = ?
             LIMIT 1`,
            [id]
        );

        return rows[0];
    },

    remove: async (id) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const existingPayment = await tuitionPaymentsModel.getRawById(id, connection);

            if (!existingPayment) {
                const error = new Error("Khong tim thay thanh toan hoc phi");
                error.statusCode = 404;
                throw error;
            }

            const [result] = await connection.query(
                "DELETE FROM tuition_payments WHERE id = ?",
                [id]
            );

            await tuitionsModel.updatePaidAmountAndStatus(existingPayment.tuition_id, connection);
            await connection.commit();

            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = tuitionPaymentsModel;
