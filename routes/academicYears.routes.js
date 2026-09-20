const express = require("express");
const router = express.Router();
const academicYearsController = require("../controllers/academicYears.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", academicYearsController.getAllAcademicYears);
router.get("/:id", academicYearsController.getAcademicYearById);
router.post("/", authorizeRoles("admin", 1), academicYearsController.createAcademicYear);
router.put("/:id", authorizeRoles("admin", 1), academicYearsController.updateAcademicYear);
router.delete("/:id", authorizeRoles("admin", 1), academicYearsController.deleteAcademicYear);

module.exports = router;
