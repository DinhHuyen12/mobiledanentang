const db = require("../config/db");
const ensureOtpCodesTable = require("../utils/ensureOtpCodesTable");

const otpCodesModel = {
    getAll: async () => {
        await ensureOtpCodesTable();

        const [rows] = await db.query(`
            SELECT id, email, otp, type, expires_at, created_at, used_at
            FROM otp_codes
            ORDER BY id DESC
        `);

        return rows;
    },

    getById: async (id) => {
        await ensureOtpCodesTable();

        const [rows] = await db.query(
            `SELECT id, email, otp, type, expires_at, created_at, used_at
             FROM otp_codes
             WHERE id = ?`,
            [id]
        );

        return rows[0];
    },

    create: async (data) => {
        await ensureOtpCodesTable();

        const { email, otp, type, expires_at, used_at } = data;

        const [result] = await db.query(
            `INSERT INTO otp_codes (email, otp, type, expires_at, used_at)
             VALUES (?, ?, ?, ?, ?)`,
            [email, otp, type, expires_at, used_at || null]
        );

        return result;
    },

    update: async (id, data) => {
        await ensureOtpCodesTable();

        const { email, otp, type, expires_at, used_at } = data;

        const [result] = await db.query(
            `UPDATE otp_codes
             SET email = ?, otp = ?, type = ?, expires_at = ?, used_at = ?
             WHERE id = ?`,
            [email, otp, type, expires_at, used_at || null, id]
        );

        return result;
    },

    remove: async (id) => {
        await ensureOtpCodesTable();

        const [result] = await db.query(
            "DELETE FROM otp_codes WHERE id = ?",
            [id]
        );

        return result;
    }
};

module.exports = otpCodesModel;
