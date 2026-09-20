const db = require("../config/db");

exports.getSummary = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as totalUsers,
                (SELECT COUNT(*) FROM subjects) as totalSubjects,
                (SELECT COUNT(*) FROM classes) as totalClasses
        `);

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
