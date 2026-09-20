const tuitionPaymentsModel = require("../models/tuitionPayments.model");
const tuitionsModel = require("../models/tuitions.model");
const { isValidDateString, isOneOf, PAYMENT_METHODS } = require("../utils/validation");

const ROLE_ADMIN = 1;
const ROLE_STUDENT = 3;
const getRoleId = (user) => Number(user?.role_id || user?.role);

exports.getAllTuitionPayments = async (req, res) => {
    try {
        const data = await tuitionPaymentsModel.getAllForUser(req.user);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach thanh toan hoc phi",
            error: error.message
        });
    }
};

exports.getTuitionPaymentById = async (req, res) => {
    try {
        const data = await tuitionPaymentsModel.getByIdForUser(req.params.id, req.user);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay thanh toan hoc phi"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay thanh toan hoc phi",
            error: error.message
        });
    }
};

exports.createTuitionPayment = async (req, res) => {
    try {
        const { tuition_id, payment_date, amount, payment_method, note } = req.body;

        if (!tuition_id || amount == null) {
            return res.status(400).json({
                message: "Thieu tuition_id hoac amount"
            });
        }

        const roleId = getRoleId(req.user);

        if (roleId !== ROLE_ADMIN && roleId !== ROLE_STUDENT) {
            return res.status(403).json({
                message: "Ban khong co quyen thanh toan hoc phi"
            });
        }

        const tuition = await tuitionsModel.getByIdForUser(tuition_id, req.user);

        if (!tuition) {
            return res.status(404).json({
                message: "Khong tim thay hoc phi hoac ban khong co quyen thanh toan"
            });
        }

        const normalizedPaymentDate = payment_date || new Date().toISOString().slice(0, 10);

        if (!isValidDateString(normalizedPaymentDate)) {
            return res.status(400).json({
                message: "payment_date khong hop le, can theo dinh dang YYYY-MM-DD"
            });
        }

        if (payment_method && !isOneOf(payment_method, PAYMENT_METHODS)) {
            return res.status(400).json({
                message: "payment_method khong hop le"
            });
        }

        const result = await tuitionPaymentsModel.create({
            tuition_id,
            payment_date: normalizedPaymentDate,
            amount,
            payment_method,
            note
        });

        const updatedTuition = await tuitionsModel.getByIdForUser(tuition_id, req.user);

        return res.status(201).json({
            message: "Tao thanh toan hoc phi thanh cong",
            id: result.insertId,
            tuition: updatedTuition
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            message: statusCode === 500 ? "Loi tao thanh toan hoc phi" : error.message,
            error: statusCode === 500 ? error.message : undefined
        });
    }
};

exports.updateTuitionPayment = async (req, res) => {
    try {
        const { tuition_id, payment_date, amount, payment_method, note } = req.body;

        if (!tuition_id || !payment_date || amount == null) {
            return res.status(400).json({
                message: "Thieu tuition_id, payment_date hoac amount"
            });
        }

        if (!isValidDateString(payment_date)) {
            return res.status(400).json({
                message: "payment_date khong hop le, can theo dinh dang YYYY-MM-DD"
            });
        }

        if (payment_method && !isOneOf(payment_method, PAYMENT_METHODS)) {
            return res.status(400).json({
                message: "payment_method khong hop le"
            });
        }

        const result = await tuitionPaymentsModel.update(req.params.id, {
            tuition_id,
            payment_date,
            amount,
            payment_method,
            note
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay thanh toan hoc phi"
            });
        }

        return res.json({
            message: "Cap nhat thanh toan hoc phi thanh cong"
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            message: statusCode === 500 ? "Loi cap nhat thanh toan hoc phi" : error.message,
            error: statusCode === 500 ? error.message : undefined
        });
    }
};

exports.deleteTuitionPayment = async (req, res) => {
    try {
        const existingPayment = await tuitionPaymentsModel.getByIdForUser(req.params.id, req.user);

        if (!existingPayment) {
            return res.status(404).json({
                message: "Khong tim thay thanh toan hoc phi"
            });
        }

        const result = await tuitionPaymentsModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay thanh toan hoc phi"
            });
        }

        return res.json({
            message: "Xoa thanh toan hoc phi thanh cong"
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            message: statusCode === 500 ? "Loi xoa thanh toan hoc phi" : error.message,
            error: statusCode === 500 ? error.message : undefined
        });
    }
};
