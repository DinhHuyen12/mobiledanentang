const express = require("express");
const router = express.Router();
const graduationRequirementsController = require("../controllers/graduationRequirements.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", authorizeRoles("admin", 1), graduationRequirementsController.getAllGraduationRequirements);
router.get("/program/:programId", authorizeRoles("admin", 1, "student", 3), graduationRequirementsController.getGraduationRequirementByProgramId);
router.get("/evaluate/me", authorizeRoles("student", 3), graduationRequirementsController.evaluateMyGraduation);
router.get("/evaluate", authorizeRoles("admin", 1, "lecturer", 2), graduationRequirementsController.evaluateGraduation);
router.post("/", authorizeRoles("admin", 1), graduationRequirementsController.createGraduationRequirement);
router.put("/:id", authorizeRoles("admin", 1), graduationRequirementsController.updateGraduationRequirement);
router.delete("/:id", authorizeRoles("admin", 1), graduationRequirementsController.deleteGraduationRequirement);

module.exports = router;
