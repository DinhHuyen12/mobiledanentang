const express = require("express");
const router = express.Router();

const facultyController = require("../controllers/facultyController");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);
router.use(authorizeRoles("admin", 1));

router.get("/", facultyController.getFaculties);

router.get("/:id", facultyController.getFacultyById);

router.post("/", facultyController.createFaculty);

router.put("/:id", facultyController.updateFaculty);

router.delete("/:id", facultyController.deleteFaculty);

module.exports = router;
