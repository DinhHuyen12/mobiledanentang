const otpCodesModel = require("../models/otpCodes.model");

exports.getAllOtpCodes = async (req, res) => {
    try {
        const data = await otpCodesModel.getAll();
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach OTP",
            error: error.message
        });
    }
};

exports.getOtpCodeById = async (req, res) => {
    try {
        const data = await otpCodesModel.getById(req.params.id);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay OTP"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay OTP",
            error: error.message
        });
    }
};

exports.createOtpCode = async (req, res) => {
    try {
        const { email, otp, type, expires_at, used_at } = req.body;

        if (!email || !otp || !type || !expires_at) {
            return res.status(400).json({
                message: "Thieu email, otp, type hoac expires_at"
            });
        }

        const result = await otpCodesModel.create({
            email,
            otp,
            type,
            expires_at,
            used_at
        });

        return res.status(201).json({
            message: "Tao OTP thanh cong",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao OTP",
            error: error.message
        });
    }
};

exports.updateOtpCode = async (req, res) => {
    try {
        const { email, otp, type, expires_at, used_at } = req.body;

        if (!email || !otp || !type || !expires_at) {
            return res.status(400).json({
                message: "Thieu email, otp, type hoac expires_at"
            });
        }

        const result = await otpCodesModel.update(req.params.id, {
            email,
            otp,
            type,
            expires_at,
            used_at
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay OTP"
            });
        }

        return res.json({
            message: "Cap nhat OTP thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat OTP",
            error: error.message
        });
    }
};

exports.deleteOtpCode = async (req, res) => {
    try {
        const result = await otpCodesModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay OTP"
            });
        }

        return res.json({
            message: "Xoa OTP thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa OTP",
            error: error.message
        });
    }
};
