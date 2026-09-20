const express = require("express");
const router = express.Router();
const semestersController = require("../controllers/semesters.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", semestersController.getAllSemesters);
router.get("/:id", semestersController.getSemesterById);
router.post("/", authorizeRoles("admin", 1), semestersController.createSemester);
router.put("/:id", authorizeRoles("admin", 1), semestersController.updateSemester);
router.delete("/:id", authorizeRoles("admin", 1), semestersController.deleteSemester);

module.exports = router;
