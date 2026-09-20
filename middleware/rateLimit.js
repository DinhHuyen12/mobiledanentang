const rateLimit = require("express-rate-limit");

// giới hạn gửi OTP
const sendOtpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 5, // tối đa 5 request
    message: {
        message: "Bạn gửi OTP quá nhiều lần, vui lòng thử lại sau 1 phút"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// giới hạn login
const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 3, // tối đa 3 lần
    message: {
        message: "Bạn đăng nhập sai quá nhiều lần, vui lòng thử lại sau"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    sendOtpLimiter,
    loginLimiter
};