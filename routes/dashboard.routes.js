const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);
router.use(authorizeRoles("admin", 1));

router.get("/summary", dashboardController.getSummary);
router.get("/recent-activities", async (req, res) => {
    try {
        const activities = [];

        // 1. USERS
        try {
            const [users] = await db.execute(`
                SELECT id, username, created_at, updated_at
                FROM users
                ORDER BY GREATEST(created_at, updated_at) DESC
                LIMIT 3
            `);

            activities.push(
                ...users.map((u) => ({
                    id: `user-${u.id}`,
                    title: "Người dùng",
                    description: `User: ${u.username}`,
                    created_at: u.updated_at || u.created_at,
                }))
            );
        } catch (err) {
            console.log("Lỗi users:", err.message);
        }

        // 2. CLASSES
        try {
            const [classes] = await db.execute(`
                SELECT id, name, created_at, updated_at
                FROM classes
                ORDER BY GREATEST(created_at, updated_at) DESC
                LIMIT 3
            `);

            activities.push(
                ...classes.map((c) => ({
                    id: `class-${c.id}`,
                    title: "Lớp học",
                    description: `Lớp: ${c.name}`,
                    created_at: c.updated_at || c.created_at,
                }))
            );
        } catch (err) {
            console.log("Lỗi classes:", err.message);
        }

        // 3. ENROLLMENTS (đăng ký học)
        try {
            const [enrollments] = await db.execute(`
                SELECT e.id, u.full_name, s.name AS subject_name, 
                       e.created_at, e.updated_at
                FROM enrollments e
                JOIN student_info si ON e.student_id = si.id
                JOIN users u ON si.user_id = u.id
                JOIN course_sections cs ON e.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                ORDER BY GREATEST(e.created_at, e.updated_at) DESC
                LIMIT 3
            `);

            activities.push(
                ...enrollments.map((e) => ({
                    id: `enroll-${e.id}`,
                    title: "Đăng ký môn",
                    description: `${e.full_name} đăng ký ${e.subject_name}`,
                    created_at: e.updated_at || e.created_at,
                }))
            );
        } catch (err) {
            console.log("Lỗi enrollments:", err.message);
        }

        // 4. GRADES (nhập điểm)
        try {
            const [grades] = await db.execute(`
                SELECT g.id, u.full_name, g.total_score, 
                       g.created_at, g.updated_at
                FROM grades g
                JOIN enrollments e ON g.enrollment_id = e.id
                JOIN student_info si ON e.student_id = si.id
                JOIN users u ON si.user_id = u.id
                ORDER BY GREATEST(g.created_at, g.updated_at) DESC
                LIMIT 3
            `);

            activities.push(
                ...grades.map((g) => ({
                    id: `grade-${g.id}`,
                    title: "Cập nhật điểm",
                    description: `${g.full_name} - Điểm: ${g.total_score}`,
                    created_at: g.updated_at || g.created_at,
                }))
            );
        } catch (err) {
            console.log("Lỗi grades:", err.message);
        }

        // 🔥 SORT TOÀN BỘ THEO THỜI GIAN GẦN NHẤT
        activities.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        res.json({
            success: true,
            data: activities.slice(0, 5),
        });

    } catch (err) {
        console.error("Lỗi route recent-activities:", err);
        res.status(500).json({
            success: false,
            message: "Lỗi lấy hoạt động",
        });
    }
});



module.exports = router;
