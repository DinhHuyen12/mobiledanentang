const express = require("express");
const router = express.Router();
const lecturerInfoController = require("../controllers/lecturerInfo.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", authorizeRoles("admin", 1, "lecturer", 2), lecturerInfoController.getAllLecturerInfo);
router.get("/:id", authorizeRoles("admin", 1, "lecturer", 2), lecturerInfoController.getLecturerInfoById);
router.post("/", authorizeRoles("admin", 1), lecturerInfoController.createLecturerInfo);
router.put("/:id", authorizeRoles("admin", 1), lecturerInfoController.updateLecturerInfo);
router.delete("/:id", authorizeRoles("admin", 1), lecturerInfoController.deleteLecturerInfo);

module.exports = router;
