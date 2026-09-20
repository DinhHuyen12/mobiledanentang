const express = require("express");
const router = express.Router();
const studentInfoController = require("../controllers/studentInfo.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");
const { excelUpload, studentDocumentsUpload } = require("../middleware/uploadMiddleware");

router.use(verifyToken);

router.get("/", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), studentInfoController.getAllStudentInfo);
router.get("/statuses", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), studentInfoController.getStudentStatuses);
router.get("/me", authorizeRoles("student", 3), studentInfoController.getMyStudentInfo);
router.get("/me/documents", authorizeRoles("student", 3), studentInfoController.getMyDocuments);
router.post(
    "/import",
    authorizeRoles("admin", 1),
    excelUpload.single("file"),
    studentInfoController.importStudentsFromExcel
);
router.delete(
    "/documents/:documentId",
    authorizeRoles("admin", 1, "student", 3),
    studentInfoController.deleteStudentDocument
);
router.get(
    "/:id/documents",
    authorizeRoles("admin", 1, "student", 3),
    studentInfoController.getStudentDocuments
);
router.post(
    "/:id/documents",
    authorizeRoles("admin", 1, "student", 3),
    studentDocumentsUpload.array("files", 5),
    studentInfoController.uploadStudentDocuments
);
router.get("/:id", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), studentInfoController.getStudentInfoById);
router.post("/", authorizeRoles("admin", 1), studentInfoController.createStudentInfo);
router.patch("/:id/status", authorizeRoles("admin", 1), studentInfoController.updateStudentStatus);
router.put("/:id", authorizeRoles("admin", 1), studentInfoController.updateStudentInfo);
router.delete("/:id", authorizeRoles("admin", 1), studentInfoController.deleteStudentInfo);

module.exports = router;
