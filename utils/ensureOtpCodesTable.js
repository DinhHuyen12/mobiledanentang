const db = require("../config/db");

let ensured = false;

const ensureOtpCodesTable = async () => {
    if (ensured) {
        return;
    }

    await db.query(`
        CREATE TABLE IF NOT EXISTS otp_codes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) NOT NULL,
            otp VARCHAR(20) NOT NULL,
            type VARCHAR(50) NOT NULL,
            expires_at DATETIME NOT NULL,
            used_at DATETIME NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    try {
        await db.query("CREATE INDEX idx_otp_codes_email_type ON otp_codes(email, type)");
    } catch (error) {
        if (!String(error.message).includes("Duplicate key name")) {
            throw error;
        }
    }

    try {
        await db.query("CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at)");
    } catch (error) {
        if (!String(error.message).includes("Duplicate key name")) {
            throw error;
        }
    }

    ensured = true;
};

module.exports = ensureOtpCodesTable;
