const cron = require("node-cron");
const db = require("../config/db");
const ensureOtpCodesTable = require("./ensureOtpCodesTable");

cron.schedule("*/30 * * * *", async () => {
    try {
        await ensureOtpCodesTable();
        console.log("--- Don OTP ---");

        const [result] = await db.query(`
            DELETE FROM otp_codes
            WHERE used_at IS NOT NULL
               OR expires_at < NOW()
        `);

        console.log("Da xoa:", result.affectedRows);
    } catch (err) {
        console.error("Loi:", err);
    }
});

module.exports = cron;
