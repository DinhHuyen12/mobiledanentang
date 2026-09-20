const express = require("express");
const router = express.Router();
const enrollmentsController = require("../controllers/enrollments.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), enrollmentsController.getAllEnrollments);
router.get("/:id", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), enrollmentsController.getEnrollmentById);
router.post("/", authorizeRoles("admin", 1, "student", 3), enrollmentsController.createEnrollment);
router.put("/:id", authorizeRoles("admin", 1, "student", 3), enrollmentsController.updateEnrollment);
router.delete("/:id", authorizeRoles("admin", 1, "student", 3), enrollmentsController.deleteEnrollment);

module.exports = router;
