// // const db = require("../config/db");

// // const userModel = {
// //     findByEmail: (email) => {
// //         return new Promise((resolve, reject) => {
// //             db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
// //                 if (err) reject(err);
// //                 resolve(result[0]);
// //             });
// //         });
// //     },

// //     create: (userData) => {
// //         return new Promise((resolve, reject) => {
// //             const { username, email, password, phone, role_id } = userData;
// //             // CHỈ INSERT các cột thực sự có trong bảng users của bạn
// //             const sql = `INSERT INTO users (username, email, password, phone, role_id) VALUES (?, ?, ?, ?, ?)`;

// //             db.query(sql, [username, email, password, phone, role_id], (err, result) => {
// //                 if (err) {
// //                     console.error("Lỗi SQL thực tế:", err.sqlMessage);
// //                     return reject(err);
// //                 }
// //                 resolve(result);
// //             });
// //         });
// //     },
// //     updatePassword: (email, password) => {
// //         return new Promise((resolve, reject) => {

// //             const sql = "UPDATE users SET password = ? WHERE email = ?";

// //             db.query(sql, [password, email], (err, result) => {

// //                 if (err) {
// //                     reject(err);
// //                 } else {
// //                     resolve(result);
// //                 }

// //             });

// //         });
// //     },



// // findById: (id) => {
// //         return new Promise((resolve, reject) => {

// //             db.query(
// //                 "SELECT * FROM users WHERE id = ?",
// //                 [id],
// //                 (err, result) => {
// //                     if (err) reject(err);
// //                     resolve(result[0]);
// //                 }
// //             );

// //         });
// //     },

// //     updatePasswordById: (id, password) => {
// //         return new Promise((resolve, reject) => {

// //             db.query(
// //                 "UPDATE users SET password = ? WHERE id = ?",
// //                 [password, id],
// //                 (err, result) => {
// //                     if (err) reject(err);
// //                     resolve(result);
// //                 }
// //             );

// //         });
// //     },
// //       getAllUsers: async () => {
// //         const [rows] = await db.query("SELECT * FROM users");
// //         return rows;
// //     },

// //     getUserById: async (id) => {
// //         const [rows] = await db.query(
// //             "SELECT * FROM users WHERE id = ?",
// //             [id]
// //         );
// //         return rows[0];
// //     },
// //     updateUser: async (id, data) => {

// //         const sql = `
// //       UPDATE users
// //       SET username=?, email=?, role_id=?
// //       WHERE id=?
// //     `;

// //         await db.query(sql, [
// //             data.username,
// //             data.email,
// //             data.role,
// //             id
// //         ]);

// //     },

// //     deleteUser: async (id) => {

// //         await db.query(
// //             "DELETE FROM users WHERE id=?",
// //             [id]
// //         );

// //     }
// // };
// // // updatePassword: (email, password) => {
// // //     return new Promise((resolve, reject) => {

// // //         db.query(
// // //             "UPDATE users SET password = ? WHERE email = ?",
// // //             [password, email],
// // //             (err, result) => {
// // //                 if (err) reject(err);
// // //                 resolve(result);
// // //             }
// // //         );

// // //     });
// // // }



// // module.exports = userModel;
// const db = require("../config/db");

// const userModel = {
//     findByEmail: async (email) => {
//         const [rows] = await db.query(
//             "SELECT * FROM users WHERE email = ?",
//             [email]
//         );
//         return rows[0];
//     },

//     // create: async (userData) => {
//     //     const { username, email, password, phone, role_id } = userData;

//     //     const sql = `
//     //         INSERT INTO users (username, email, password, phone, role_id)
//     //         VALUES (?, ?, ?, ?, ?)
//     //     `;

//     //     const [result] = await db.query(sql, [
//     //         username,
//     //         email,
//     //         password,
//     //         phone,
//     //         role_id
//     //     ]);

//     //     return result;
//     // },
//     create: async (userData) => {
//         const { username, email, password, phone, role_id, full_name } = userData;

//         const sql = `
//         INSERT INTO users (username, email, password, phone, full_name, role_id)
//         VALUES (?, ?, ?, ?, ?, ?)
//     `;

//         const [result] = await db.query(sql, [
//             username,
//             email,
//             password,
//             phone,
//             full_name,
//             role_id
//         ]);

//         return result;
//     },

//     updatePassword: async (email, password) => {
//         const sql = "UPDATE users SET password = ? WHERE email = ?";
//         const [result] = await db.query(sql, [password, email]);
//         return result;
//     },

//     findById: async (id) => {
//         const [rows] = await db.query(
//             "SELECT * FROM users WHERE id = ?",
//             [id]
//         );
//         return rows[0];
//     },

//     updatePasswordById: async (id, password) => {
//         const [result] = await db.query(
//             "UPDATE users SET password = ? WHERE id = ?",
//             [password, id]
//         );
//         return result;
//     },

//     getAllUsers: async () => {
//         const [rows] = await db.query("SELECT * FROM users");
//         return rows;
//     },

//     getUserById: async (id) => {
//         const [rows] = await db.query(
//             "SELECT * FROM users WHERE id = ?",
//             [id]
//         );
//         return rows[0];
//     },

//     updateUser: async (id, data) => {
//         const sql = `
//             UPDATE users
//             SET username=?, email=?, role_id=?
//             WHERE id=?
//         `;

//         const [result] = await db.query(sql, [
//             data.username,
//             data.email,
//             data.role_id,
//             id
//         ]);

//         return result;
//     },

//     deleteUser: async (id) => {
//         const [result] = await db.query(
//             "DELETE FROM users WHERE id=?",
//             [id]
//         );
//         return result;
//     }
// };

// module.exports = userModel;

const db = require("../config/db");

const userModel = {
    findByEmail: async (email) => {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        return rows[0];
    },

    findByUsernameOrEmail: async (username, email) => {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE username = ? OR email = ?",
            [username, email]
        );
        return rows;
    },

    create: async (userData) => {
        const { username, email, password, phone, role_id, full_name } = userData;

        const sql = `
      INSERT INTO users (username, email, password, phone, full_name, role_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

        const [result] = await db.query(sql, [
            username,
            email,
            password,
            phone || null,
            full_name || null,
            role_id || null,
        ]);

        return result;
    },

    updatePassword: async (email, password) => {
        const sql = "UPDATE users SET password = ? WHERE email = ?";
        const [result] = await db.query(sql, [password, email]);
        return result;
    },

    findById: async (id) => {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE id = ?",
            [id]
        );
        return rows[0];
    },

    updatePasswordById: async (id, password) => {
        const [result] = await db.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [password, id]
        );
        return result;
    },

    getAllUsers: async () => {
        const [rows] = await db.query(
            `SELECT id, username, email, full_name, phone, role_id, created_at
       FROM users
       ORDER BY id DESC`
        );
        return rows;
    },

    getUserById: async (id) => {
        const [rows] = await db.query(
            `SELECT id, username, email, full_name, phone, role_id, created_at
       FROM users
       WHERE id = ?`,
            [id]
        );
        return rows[0];
    },

    updateUser: async (id, data) => {
        const { username, email, full_name, phone, role_id, password } = data;

        if (password) {
            const sql = `
        UPDATE users
        SET username = ?, email = ?, full_name = ?, phone = ?, role_id = ?, password = ?
        WHERE id = ?
      `;

            const [result] = await db.query(sql, [
                username,
                email,
                full_name || null,
                phone || null,
                role_id || null,
                password,
                id,
            ]);

            return result;
        }

        const sql = `
      UPDATE users
      SET username = ?, email = ?, full_name = ?, phone = ?, role_id = ?
      WHERE id = ?
    `;

        const [result] = await db.query(sql, [
            username,
            email,
            full_name || null,
            phone || null,
            role_id || null,
            id,
        ]);

        return result;
    },

    deleteUser: async (id) => {
        const [result] = await db.query(
            "DELETE FROM users WHERE id = ?",
            [id]
        );
        return result;
    },

    searchUsers: async (keyword) => {
        const value = `%${String(keyword || "").trim().toLowerCase()}%`;

        const [rows] = await db.query(
            `SELECT id, username, email, full_name, phone, role_id, created_at
       FROM users
       WHERE LOWER(username) LIKE ?
          OR LOWER(email) LIKE ?
          OR LOWER(full_name) LIKE ?
          OR phone LIKE ?
       ORDER BY id DESC`,
            [value, value, value, value]
        );

        return rows;
    },
};

module.exports = userModel;