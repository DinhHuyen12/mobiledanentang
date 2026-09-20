// const db = require("../config/db");

// const authModel = {

//     findUserByEmail: (email) => {
//         return new Promise((resolve, reject) => {

//             db.query(
//                 "SELECT * FROM users WHERE email = ?",
//                 [email],
//                 (err, result) => {
//                     if (err) reject(err);
//                     resolve(result[0]);
//                 }
//             );

//         });
//     },

//     saveLoginOTP: (email, otp) => {
//         return new Promise((resolve, reject) => {

//             const sql = `
//         INSERT INTO otp_codes (email, otp, type, expires_at)
//         VALUES (?, ?, 'login', DATE_ADD(NOW(), INTERVAL 5 MINUTE))
//         `;

//             db.query(sql, [email, otp], (err, result) => {
//                 if (err) reject(err);
//                 resolve(result);
//             });

//         });
//     },

//     findValidLoginOTP: (email, otp) => {
//         return new Promise((resolve, reject) => {

//             const sql = `
//         SELECT * FROM otp_codes
//         WHERE email=? AND otp=?
//         AND used_at IS NULL
//         AND expires_at > NOW()
//         ORDER BY created_at DESC LIMIT 1
//         `;

//             db.query(sql, [email, otp], (err, result) => {
//                 if (err) reject(err);
//                 resolve(result[0]);
//             });

//         });
//     },

//     markOTPUsed: (id) => {
//         return new Promise((resolve, reject) => {

//             db.query(
//                 "UPDATE otp_codes SET used_at = NOW() WHERE id=?",
//                 [id],
//                 (err, result) => {
//                     if (err) reject(err);
//                     resolve(result);
//                 }
//             );

//         });
//     }

// };

// module.exports = authModel;
const db = require("../config/db");
const ensureOtpCodesTable = require("../utils/ensureOtpCodesTable");

const authModel = {
    findUserByEmail: async (email) => {
        const [rows] = await db.query(
            `SELECT u.*, r.name AS role_name
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE u.email = ?`,
            [email]
        );
        return rows[0];
    },

    saveLoginOTP: async (email, otp) => {
        await ensureOtpCodesTable();

        const sql = `
            INSERT INTO otp_codes (email, otp, type, expires_at)
            VALUES (?, ?, 'login', DATE_ADD(NOW(), INTERVAL 5 MINUTE))
        `;

        const [result] = await db.query(sql, [email, otp]);
        return result;
    },

    invalidateUnusedLoginOTPs: async (email) => {
        await ensureOtpCodesTable();

        const [result] = await db.query(
            `UPDATE otp_codes
             SET used_at = NOW()
             WHERE email = ?
               AND type = 'login'
               AND used_at IS NULL`,
            [email]
        );

        return result;
    },

    findValidLoginOTP: async (email, otp) => {
        await ensureOtpCodesTable();

        const sql = `
            SELECT * FROM otp_codes
            WHERE email = ? AND otp = ?
            AND used_at IS NULL
            AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
        `;

        const [rows] = await db.query(sql, [email, otp]);
        return rows[0];
    },

    markOTPUsed: async (id) => {
        await ensureOtpCodesTable();

        const [result] = await db.query(
            "UPDATE otp_codes SET used_at = NOW() WHERE id=?",
            [id]
        );
        return result;
    }
};

module.exports = authModel;
