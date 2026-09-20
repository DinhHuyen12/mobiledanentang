const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { loginLimiter, sendOtpLimiter } = require("../middleware/rateLimit");

router.post("/register", sendOtpLimiter, authController.register);
router.post("/verify-register", authController.verifyRegister);
router.post("/login", loginLimiter, authController.login);
router.post("/verify-otp", loginLimiter, authController.verifyOTP);
router.post("/forgot-password", sendOtpLimiter, authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// router.post("/change-password", authController.changePassword);

module.exports = router;
