const express = require("express");
const router = express.Router();
const tuitionPaymentsController = require("../controllers/tuitionPayments.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", tuitionPaymentsController.getAllTuitionPayments);
router.get("/:id", tuitionPaymentsController.getTuitionPaymentById);
router.post("/", authorizeRoles("admin", 1, "student", 3), tuitionPaymentsController.createTuitionPayment);
router.put("/:id", authorizeRoles("admin", 1), tuitionPaymentsController.updateTuitionPayment);
router.delete("/:id", authorizeRoles("admin", 1), tuitionPaymentsController.deleteTuitionPayment);

module.exports = router;
