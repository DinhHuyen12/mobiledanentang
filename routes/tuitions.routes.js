const express = require("express");
const router = express.Router();
const tuitionsController = require("../controllers/tuitions.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.get("/vnpay/return", tuitionsController.handleVnpayReturn);
router.get("/vnpay/mock-gateway", tuitionsController.handleMockVnpayGateway);

router.use(verifyToken);

router.get("/", tuitionsController.getAllTuitions);
router.get("/:id", tuitionsController.getTuitionById);
router.get("/:id/payments", tuitionsController.getTuitionPayments);
router.get("/:id/payment-methods", authorizeRoles("admin", 1, "student", 3), tuitionsController.getPaymentMethods);
router.post("/:id/pay", authorizeRoles("admin", 1, "student", 3), tuitionsController.payTuition);
router.post("/:id/pay/mock-vnpay", authorizeRoles("admin", 1, "student", 3), tuitionsController.createMockVnpayPayment);
router.post("/:id/pay/vnpay", authorizeRoles("admin", 1, "student", 3), tuitionsController.createVnpayPayment);
router.post("/", authorizeRoles("admin", 1), tuitionsController.createTuition);
router.put("/:id", authorizeRoles("admin", 1), tuitionsController.updateTuition);
router.delete("/:id", authorizeRoles("admin", 1), tuitionsController.deleteTuition);

module.exports = router;
