const express = require("express");
const router = express.Router();
const otpCodesController = require("../controllers/otpCodes.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);
router.use(authorizeRoles("admin", 1));

router.get("/", otpCodesController.getAllOtpCodes);
router.get("/:id", otpCodesController.getOtpCodeById);
router.post("/", otpCodesController.createOtpCode);
router.put("/:id", otpCodesController.updateOtpCode);
router.delete("/:id", otpCodesController.deleteOtpCode);

module.exports = router;
