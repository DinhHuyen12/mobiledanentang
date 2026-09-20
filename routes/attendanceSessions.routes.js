const express = require("express");
const router = express.Router();
const attendanceSessionsController = require("../controllers/attendanceSessions.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), attendanceSessionsController.getAllAttendanceSessions);
router.post("/", authorizeRoles("admin", 1, "lecturer", 2), attendanceSessionsController.createAttendanceSession);
router.get("/:id", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), attendanceSessionsController.getAttendanceSessionById);
router.put("/:id", authorizeRoles("admin", 1, "lecturer", 2), attendanceSessionsController.updateAttendanceSession);
router.delete("/:id", authorizeRoles("admin", 1, "lecturer", 2), attendanceSessionsController.deleteAttendanceSession);
router.get("/:id/records", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), attendanceSessionsController.getAttendanceSessionRecords);
router.get("/:id/export", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), attendanceSessionsController.exportAttendanceSessionRecords);
router.put("/:id/records", authorizeRoles("admin", 1, "lecturer", 2), attendanceSessionsController.upsertAttendanceSessionRecords);

module.exports = router;
