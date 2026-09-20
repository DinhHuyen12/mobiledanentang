const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mailer");
const userModel = require("../models/userModel");
const otpModel = require("../models/otpModel");
const authModel = require("../models/authModel");

const ROLE_ADMIN = 1;
const ROLE_LECTURER = 2;
const ROLE_STUDENT = 3;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const sendOtpEmail = async (email, subject, text) => {
    const recipientEmail = normalizeEmail(email);

    if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
        return recipientEmail;
    }

    await transporter.sendMail({
        from: process.env.EMAIL,
        to: recipientEmail,
        subject,
        text
    });

    return recipientEmail;
};

const validateRegistrationPayload = (payload) => {
    const {
        username,
        email,
        password,
        role_id,
        class_id,
        enrollment_date,
        status,
        lecturer_code,
        academic_rank,
        specialization
    } = payload;

    if (!username || !email || !password) {
        return {
            ok: false,
            code: 400,
            message: "Thieu username, email hoac password"
        };
    }

    const normalizedRoleId = role_id === undefined || role_id === null || role_id === ""
        ? ROLE_STUDENT
        : Number(role_id);

    if (!Number.isInteger(normalizedRoleId)) {
        return {
            ok: false,
            code: 400,
            message: "role_id khong hop le"
        };
    }

    if (normalizedRoleId !== ROLE_STUDENT) {
        return {
            ok: false,
            code: 403,
            message: "Dang ky cong khai chi cho phep tao tai khoan sinh vien"
        };
    }

    if (normalizedRoleId === ROLE_STUDENT && (!class_id || !enrollment_date || !status)) {
        return {
            ok: false,
            code: 400,
            message: "Tai khoan hoc sinh phai co class_id, enrollment_date va status"
        };
    }

    if (normalizedRoleId === ROLE_LECTURER && (!lecturer_code || !academic_rank || !specialization)) {
        return {
            ok: false,
            code: 400,
            message: "Tai khoan giang vien phai co lecturer_code, academic_rank va specialization"
        };
    }

    return {
        ok: true,
        normalizedRoleId
    };
};

exports.register = async (req, res) => {
    try {
        const validation = validateRegistrationPayload(req.body);

        if (!validation.ok) {
            return res.status(validation.code).json({
                message: validation.message
            });
        }

        const { username, email } = req.body;
        const existingUsers = await userModel.findByUsernameOrEmail(username, email);

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "Username hoac email da ton tai"
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await otpModel.create(email, otp, "register");

        await sendOtpEmail(
            email,
            "Ma OTP dang ky tai khoan",
            `Ma OTP dang ky cua ban la: ${otp}`
        );

        return res.json({
            message: "Da tao OTP dang ky thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao OTP dang ky",
            error: error.message
        });
    }
};

exports.verifyRegister = async (req, res) => {
    const connection = await db.getConnection();
    let transactionStarted = false;

    try {
        const validation = validateRegistrationPayload(req.body);

        if (!validation.ok) {
            return res.status(validation.code).json({
                message: validation.message
            });
        }

        const {
            username,
            email,
            password,
            phone,
            otp,
            full_name,
            class_id,
            enrollment_date,
            status,
            lecturer_code,
            academic_rank,
            specialization
        } = req.body;

        if (!otp) {
            return res.status(400).json({
                message: "Thieu otp"
            });
        }

        const existingUsers = await userModel.findByUsernameOrEmail(username, email);

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "Username hoac email da ton tai"
            });
        }

        const otpRecord = await otpModel.findValidOTP(email, otp, "register");

        if (!otpRecord) {
            return res.status(400).json({
                message: "OTP sai hoac het han"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await connection.beginTransaction();
        transactionStarted = true;

        const [userResult] = await connection.query(
            `INSERT INTO users (username, email, password, phone, full_name, role_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                username,
                email,
                hashedPassword,
                phone || null,
                full_name || username,
                validation.normalizedRoleId
            ]
        );

        const userId = userResult.insertId;

        if (validation.normalizedRoleId === ROLE_STUDENT) {
            await connection.query(
                `INSERT INTO student_info (user_id, class_id, enrollment_date, status)
                 VALUES (?, ?, ?, ?)`,
                [userId, class_id, enrollment_date, status]
            );
        }

        if (validation.normalizedRoleId === ROLE_LECTURER) {
            await connection.query(
                `INSERT INTO lecturer_info (user_id, lecturer_code, academic_rank, specialization)
                 VALUES (?, ?, ?, ?)`,
                [userId, lecturer_code, academic_rank, specialization]
            );
        }

        await connection.query(
            "UPDATE otp_codes SET used_at = NOW() WHERE id = ?",
            [otpRecord.id]
        );

        await connection.commit();

        return res.status(201).json({
            message: "Dang ky thanh cong"
        });
    } catch (error) {
        if (transactionStarted) {
            await connection.rollback();
        }
        return res.status(500).json({
            message: "Loi xac nhan dang ky",
            error: error.message
        });
    } finally {
        connection.release();
    }
};

exports.login = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Thieu email hoac password"
            });
        }

        const user = await authModel.findUserByEmail(email);

        if (!user) {
            return res.status(400).json({
                message: "Email khong ton tai"
            });
        }

        const isMatched = await bcrypt.compare(password, user.password);

        if (!isMatched) {
            return res.status(400).json({
                message: "Sai mat khau"
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await authModel.invalidateUnusedLoginOTPs(email);
        await authModel.saveLoginOTP(email, otp);

        const sentTo = await sendOtpEmail(
            email,
            "Ma OTP dang nhap",
            `Ma OTP dang nhap cua ban la: ${otp}`
        );

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role_id,
                role_id: user.role_id,
                role_name: user.role_name
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const redirectTo = user.role_name === "admin" || user.role_id === ROLE_ADMIN
            ? "/admin"
            : user.role_name === "lecturer" || user.role_id === ROLE_LECTURER
                ? "/lecturer"
                : "/student";

        return res.json({
            message: "OTP da duoc gui den email",
            token,
            redirect_to: redirectTo,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role_id: user.role_id,
                role_name: user.role_name
            },
            otp_required: true,
            sent_to: sentTo,
            dev_otp: String(email).endsWith(".local") ? otp : undefined
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi login",
            error: error.message
        });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Thieu email hoac otp"
            });
        }

        const otpRecord = await authModel.findValidLoginOTP(email, otp);

        if (!otpRecord) {
            return res.status(400).json({
                message: "OTP khong dung hoac het han"
            });
        }

        const user = await authModel.findUserByEmail(email);

        if (!user) {
            return res.status(404).json({
                message: "Khong tim thay user"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role_id,
                role_id: user.role_id,
                role_name: user.role_name
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        await authModel.markOTPUsed(otpRecord.id);

        const redirectTo = user.role_name === "admin" || user.role_id === ROLE_ADMIN
            ? "/admin"
            : user.role_name === "lecturer" || user.role_id === ROLE_LECTURER
                ? "/lecturer"
                : "/student";

        return res.json({
            message: "Dang nhap thanh cong",
            token,
            redirect_to: redirectTo,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role_id: user.role_id,
                role_name: user.role_name
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi verify OTP",
            error: error.message
        });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Thieu email"
            });
        }

        const user = await authModel.findUserByEmail(email);

        if (!user) {
            return res.status(404).json({
                message: "Email khong ton tai"
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await otpModel.create(email, otp, "forgot_password");

        await sendOtpEmail(
            email,
            "Ma OTP dat lai mat khau",
            `Ma OTP dat lai mat khau cua ban la: ${otp}`
        );

        return res.json({
            message: "OTP da duoc gui ve email"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi quen mat khau",
            error: error.message
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message: "Thieu email, otp hoac newPassword"
            });
        }

        const otpRecord = await otpModel.findValidOTP(email, otp, "forgot_password");

        if (!otpRecord) {
            return res.status(400).json({
                message: "OTP khong dung hoac het han"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userModel.updatePassword(email, hashedPassword);
        await otpModel.markAsUsed(otpRecord.id);

        return res.json({
            message: "Dat lai mat khau thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi reset password",
            error: error.message
        });
    }
};
