const express = require("express");
const router = express.Router();
const academicAdvisorsController = require("../controllers/academicAdvisors.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), academicAdvisorsController.getAllAcademicAdvisors);
router.get("/me", authorizeRoles("lecturer", 2, "student", 3), academicAdvisorsController.getMyAcademicAdvisors);
router.get("/:id", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), academicAdvisorsController.getAcademicAdvisorById);
router.post("/", authorizeRoles("admin", 1), academicAdvisorsController.createAcademicAdvisor);
router.put("/:id", authorizeRoles("admin", 1), academicAdvisorsController.updateAcademicAdvisor);
router.delete("/:id", authorizeRoles("admin", 1), academicAdvisorsController.deleteAcademicAdvisor);

module.exports = router;
