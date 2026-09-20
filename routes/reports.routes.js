const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reports.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);
router.use(authorizeRoles("admin", 1));

router.get("/academic-warnings", reportsController.getAcademicWarnings);
router.get("/tuition-debts", reportsController.getTuitionDebts);
router.get("/financial", reportsController.getFinancialReport);
router.get("/finance", reportsController.getFinancialReport);
router.get("/financial-report", reportsController.getFinancialReport);
router.get("/finance-summary", reportsController.getFinancialReport);

module.exports = router;
