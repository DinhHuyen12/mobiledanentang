const express = require("express");
const router = express.Router();
const classesController = require("../controllers/classes.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", classesController.getAllClasses);
router.get("/:id", classesController.getClassById);
router.post("/", authorizeRoles("admin", 1), classesController.createClass);
router.put("/:id", authorizeRoles("admin", 1), classesController.updateClass);
router.delete("/:id", authorizeRoles("admin", 1), classesController.deleteClass);

module.exports = router;
