const express = require("express");
const router = express.Router();
const subjectPrerequisitesController = require("../controllers/subjectPrerequisites.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", subjectPrerequisitesController.getAllSubjectPrerequisites);
router.get("/subject/:subjectId", subjectPrerequisitesController.getSubjectPrerequisitesBySubjectId);
router.post("/", authorizeRoles("admin", 1), subjectPrerequisitesController.createSubjectPrerequisite);
router.put("/:subjectId/:prerequisiteId", authorizeRoles("admin", 1), subjectPrerequisitesController.updateSubjectPrerequisite);
router.delete("/:subjectId/:prerequisiteId", authorizeRoles("admin", 1), subjectPrerequisitesController.deleteSubjectPrerequisite);

module.exports = router;
