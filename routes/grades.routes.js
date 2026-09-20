const express = require("express");
const router = express.Router();
const gradesController = require("../controllers/grades.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), gradesController.getAllGrades);
router.post("/calculate", authorizeRoles("admin", 1, "lecturer", 2), gradesController.calculateGrade);
router.get("/export/transcript", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), gradesController.exportTranscript);
router.get("/transcript", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), gradesController.getTranscript);
router.get("/academic-summary", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), gradesController.getAcademicSummary);
router.get("/progress", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), gradesController.getAcademicProgress);
router.get("/:id", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), gradesController.getGradeById);
router.post("/", authorizeRoles("admin", 1, "lecturer", 2), gradesController.createGrade);
router.put("/:id", authorizeRoles("admin", 1, "lecturer", 2), gradesController.updateGrade);
router.delete("/:id", authorizeRoles("admin", 1), gradesController.deleteGrade);

module.exports = router;
