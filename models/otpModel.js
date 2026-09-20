// // // const db = require("../config/db");

// // // // const otpModel = {
// // // //     // Lưu OTP mới
// // // //     create: (email, otp, type) => {
// // // //         return new Promise((resolve, reject) => {
// // // //             const sql = `INSERT INTO otp_codes (email, otp, type, expires_at)
// // // //                          VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`;
// // // //             db.query(sql, [email, otp, type], (err, result) => {
// // // //                 if (err) reject(err);
// // // //                 resolve(result);
// // // //             });
// // // //         });
// // // //     },

// // // //     // Tìm OTP hợp lệ để verify
// // // //     findValidOTP: (email, otp) => {
// // // //         return new Promise((resolve, reject) => {
// // // //             const sql = `SELECT * FROM otp_codes
// // // //                          WHERE email = ? AND otp = ?
// // // //                          AND used_at IS NULL AND expires_at > NOW()
// // // //                          ORDER BY created_at DESC LIMIT 1`;
// // // //             db.query(sql, [email, otp], (err, result) => {
// // // //                 if (err) reject(err);
// // // //                 resolve(result[0]); // Trả về 1 bản ghi duy nhất
// // // //             });
// // // //         });
// // // //     },

// // // //     // Đánh dấu đã sử dụng
// // // //     markAsUsed: (id) => {
// // // //         return new Promise((resolve, reject) => {
// // // //             db.query("UPDATE otp_codes SET used_at = NOW() WHERE id = ?", [id], (err, result) => {
// // // //                 if (err) reject(err);
// // // //                 resolve(result);
// // // //             });
// // // //         });
// // // //     }
// // // // };
// // // const db = require("../config/db");

// // // const otpModel = {
// // //     // Tạo mã OTP mới
// // //     create: (email, otp, type) => {
// // //         return new Promise((resolve, reject) => {
// // //             const sql = `
// // //                 INSERT INTO otp_codes (email, otp, type, expires_at)
// // //                 VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
// // //             `;
// // //             db.query(sql, [email, otp, type], (err, result) => {
// // //                 if (err) reject(err);
// // //                 resolve(result);
// // //             });
// // //         });
// // //     },

// // //     // Tìm mã OTP hợp lệ (chưa dùng, chưa hết hạn)
// // //     findValidOTP: (email, otp) => {
// // //         return new Promise((resolve, reject) => {
// // //             const sql = `
// // //                 SELECT * FROM otp_codes
// // //                 WHERE email = ? AND otp = ?
// // //                 AND used_at IS NULL
// // //                 AND expires_at > NOW()
// // //                 ORDER BY created_at DESC LIMIT 1
// // //             `;
// // //             db.query(sql, [email, otp], (err, result) => {
// // //                 if (err) reject(err);
// // //                 resolve(result[0]);
// // //             });
// // //         });
// // //     },

// // //     // Đánh dấu mã đã sử dụng
// // //     markAsUsed: (id) => {
// // //         return new Promise((resolve, reject) => {
// // //             db.query("UPDATE otp_codes SET used_at = NOW() WHERE id = ?", [id], (err, result) => {
// // //                 if (err) reject(err);
// // //                 resolve(result);
// // //             });
// // //         });
// // //     }
// // // };

// // // module.exports = otpModel;

// // const db = require("../config/db");

// // const otpModel = {

// //     create: (email, otp, type) => {
// //         return new Promise((resolve, reject) => {

// //             const sql = `
// //         INSERT INTO otp_codes (email, otp, type, expires_at)
// //         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
// //         `;

// //             db.query(sql, [email, otp, type], (err, result) => {
// //                 if (err) reject(err);
// //                 resolve(result);
// //             });

// //         });
// //     },

// //     findValidOTP: (email, otp) => {
// //         return new Promise((resolve, reject) => {

// //             const sql = `
// //         SELECT * FROM otp_codes
// //         WHERE email=? AND otp=? AND used_at IS NULL AND expires_at > NOW()
// //         ORDER BY created_at DESC LIMIT 1
// //         `;

// //             db.query(sql, [email, otp], (err, result) => {
// //                 if (err) reject(err);
// //                 resolve(result[0]);
// //             });

// //         });
// //     },

// //     markAsUsed: (id) => {
// //         return new Promise((resolve, reject) => {

// //             db.query(
// //                 "UPDATE otp_codes SET used_at = NOW() WHERE id=?",
// //                 [id],
// //                 (err, result) => {
// //                     if (err) reject(err);
// //                     resolve(result);
// //                 }
// //             );

// //         });
// //     }

// // };

// // module.exports = otpModel;
// const db = require("../config/db");

// const otpModel = {
//     create: async (email, otp, type) => {
//         const sql = `
//             INSERT INTO otp_codes (email, otp, type, expires_at)
//             VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
//         `;

//         const [result] = await db.query(sql, [email, otp, type]);
//         return result;
//     },

//     findValidOTP: async (email, otp, type) => {
//         const sql = `
//             SELECT * FROM otp_codes
//             WHERE email = ? AND otp = ? AND type = ?
//             AND expires_at > NOW()
//             ORDER BY created_at DESC
//             LIMIT 1
//         `;

//         const [rows] = await db.query(sql, [email, otp, type]);
//         return rows[0];
//     }
// };

// module.exports = otpModel;
const db = require("../config/db");
const ensureOtpCodesTable = require("../utils/ensureOtpCodesTable");

const otpModel = {
    create: async (email, otp, type) => {
        await ensureOtpCodesTable();

        const sql = `
            INSERT INTO otp_codes (email, otp, type, expires_at)
            VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
        `;

        const [result] = await db.query(sql, [email, otp, type]);
        return result;
    },

    findValidOTP: async (email, otp, type) => {
        await ensureOtpCodesTable();

        const sql = `
            SELECT *
            FROM otp_codes
            WHERE email = ?
              AND otp = ?
              AND type = ?
              AND expires_at > NOW()
              AND used_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        `;

        const [rows] = await db.query(sql, [email, otp, type]);
        return rows[0];
    },

    markAsUsed: async (id) => {
        await ensureOtpCodesTable();

        const sql = `
            UPDATE otp_codes
            SET used_at = NOW()
            WHERE id = ?
        `;

        const [result] = await db.query(sql, [id]);
        return result;
    }
};

module.exports = otpModel;
