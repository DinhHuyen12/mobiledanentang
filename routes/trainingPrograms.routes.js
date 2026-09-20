const express = require("express");
const router = express.Router();
const trainingProgramsController = require("../controllers/trainingPrograms.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), trainingProgramsController.getAllTrainingPrograms);
router.get("/my-program", authorizeRoles("student", 3), trainingProgramsController.getMyTrainingProgram);
router.get("/:id", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), trainingProgramsController.getTrainingProgramById);
router.post("/", authorizeRoles("admin", 1), trainingProgramsController.createTrainingProgram);
router.post("/assign-student", authorizeRoles("admin", 1), trainingProgramsController.assignStudentToProgram);
router.post("/curriculum-subjects", authorizeRoles("admin", 1), trainingProgramsController.addCurriculumSubject);
router.put("/:id", authorizeRoles("admin", 1), trainingProgramsController.updateTrainingProgram);
router.put("/curriculum-subjects/:id", authorizeRoles("admin", 1), trainingProgramsController.updateCurriculumSubject);
router.delete("/:id", authorizeRoles("admin", 1), trainingProgramsController.deleteTrainingProgram);
router.delete("/curriculum-subjects/:id", authorizeRoles("admin", 1), trainingProgramsController.deleteCurriculumSubject);

module.exports = router;
