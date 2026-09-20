const express = require("express");
const router = express.Router();
const scholarshipsController = require("../controllers/scholarships.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), scholarshipsController.getAllScholarships);
router.get("/awards", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), scholarshipsController.getScholarshipAwards);
router.get("/awards/me", authorizeRoles("student", 3), scholarshipsController.getMyScholarshipAwards);
router.get("/:id", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), scholarshipsController.getScholarshipById);
router.post("/", authorizeRoles("admin", 1), scholarshipsController.createScholarship);
router.post("/awards", authorizeRoles("admin", 1), scholarshipsController.awardScholarship);
router.put("/:id", authorizeRoles("admin", 1), scholarshipsController.updateScholarship);
router.put("/awards/:id", authorizeRoles("admin", 1), scholarshipsController.updateScholarshipAward);
router.delete("/:id", authorizeRoles("admin", 1), scholarshipsController.deleteScholarship);
router.delete("/awards/:id", authorizeRoles("admin", 1), scholarshipsController.deleteScholarshipAward);

module.exports = router;
