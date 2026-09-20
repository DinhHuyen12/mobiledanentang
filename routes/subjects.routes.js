const express = require("express");
const router = express.Router();

const subjectsController = require("../controllers/subjects.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", subjectsController.getAllSubjects);

router.get("/:id", subjectsController.getSubjectById);

router.post("/", authorizeRoles("admin", 1), subjectsController.createSubject);

router.put("/:id", authorizeRoles("admin", 1), subjectsController.updateSubject);

router.delete("/:id", authorizeRoles("admin", 1), subjectsController.deleteSubject);

module.exports = router;
