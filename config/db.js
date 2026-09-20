// const mysql = require("mysql2/promise");

// const db = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME
// });

// db.connect(err => {
//     if (err) {
//         console.log("DB Error:", err);
//     } else {
//         console.log("Database connected");
//     }
// });

// module.exports = db;
const mysql = require("mysql2/promise");

const dbPort = Number(process.env.DB_PORT || 3306);

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number.isFinite(dbPort) ? dbPort : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function connectDB() {
    try {
        const connection = await db.getConnection();
        console.log(`Database connected to ${process.env.DB_HOST}:${Number.isFinite(dbPort) ? dbPort : 3306}`);
        connection.release();
    } catch (error) {
        console.log("DB Error:", {
            message: error.message,
            code: error.code,
            host: process.env.DB_HOST,
            port: Number.isFinite(dbPort) ? dbPort : 3306,
            database: process.env.DB_NAME
        });
    }
}

connectDB();

module.exports = db;
