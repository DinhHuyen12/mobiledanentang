const express = require("express");
const router = express.Router();
const studentStatusRecordsController = require("../controllers/studentStatusRecords.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), studentStatusRecordsController.getAllStudentStatusRecords);
router.get("/me", authorizeRoles("student", 3), studentStatusRecordsController.getMyStudentStatusRecords);
router.get("/:id", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), studentStatusRecordsController.getStudentStatusRecordById);
router.post("/", authorizeRoles("admin", 1), studentStatusRecordsController.createStudentStatusRecord);
router.put("/:id", authorizeRoles("admin", 1), studentStatusRecordsController.updateStudentStatusRecord);
router.delete("/:id", authorizeRoles("admin", 1), studentStatusRecordsController.deleteStudentStatusRecord);

module.exports = router;
