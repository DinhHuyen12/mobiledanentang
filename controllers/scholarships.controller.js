const scholarshipsModel = require("../models/scholarships.model");
const {
    isValidDateString,
    isOneOf,
    SCHOLARSHIP_STATUSES,
    SCHOLARSHIP_AWARD_STATUSES
} = require("../utils/validation");

const validateScholarshipPayload = async ({ amount, semester_id, min_gpa, status }) => {
    const normalizedAmount = Number(amount);
    const normalizedMinGpa = min_gpa == null || min_gpa === "" ? null : Number(min_gpa);

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        return "amount phai la so duong";
    }

    if (normalizedMinGpa !== null && (!Number.isFinite(normalizedMinGpa) || normalizedMinGpa < 0 || normalizedMinGpa > 4)) {
        return "min_gpa phai nam trong khoang 0 den 4";
    }

    if (!isOneOf(status, SCHOLARSHIP_STATUSES)) {
        return "status hoc bong khong hop le";
    }

    if (!(await scholarshipsModel.semesterExists(semester_id))) {
        return "Khong tim thay hoc ky";
    }

    return null;
};

const validateScholarshipAwardPayload = async ({ scholarship_id, student_id, awarded_date, status }, excludeId = null) => {
    if (!(await scholarshipsModel.getById(Number(scholarship_id)))) {
        return "Khong tim thay hoc bong";
    }

    if (!(await scholarshipsModel.studentExists(Number(student_id)))) {
        return "Khong tim thay sinh vien";
    }

    if (!isValidDateString(awarded_date)) {
        return "awarded_date khong hop le, can theo dinh dang YYYY-MM-DD";
    }

    if (!isOneOf(status, SCHOLARSHIP_AWARD_STATUSES)) {
        return "status cap hoc bong khong hop le";
    }

    if (await scholarshipsModel.awardConflictExists(Number(scholarship_id), Number(student_id), excludeId)) {
        return "Sinh vien da duoc cap hoc bong nay";
    }

    return null;
};

exports.getAllScholarships = async (req, res) => {
    try {
        const data = await scholarshipsModel.getAll();
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach hoc bong",
            error: error.message
        });
    }
};

exports.getScholarshipById = async (req, res) => {
    try {
        const data = await scholarshipsModel.getById(req.params.id);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay hoc bong"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay hoc bong",
            error: error.message
        });
    }
};

exports.getScholarshipAwards = async (req, res) => {
    try {
        const data = await scholarshipsModel.getAwardRowsForUser(req.user);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach hoc bong da cap",
            error: error.message
        });
    }
};

exports.getMyScholarshipAwards = async (req, res) => {
    try {
        const data = await scholarshipsModel.getAwardRowsForUser(req.user);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay hoc bong cua toi",
            error: error.message
        });
    }
};

exports.createScholarship = async (req, res) => {
    try {
        const { name, description, amount, semester_id, min_gpa, status } = req.body;

        if (!name || amount === undefined || !status) {
            return res.status(400).json({
                message: "Thieu name, amount hoac status"
            });
        }

        const validationMessage = await validateScholarshipPayload(req.body);
        if (validationMessage) {
            return res.status(400).json({ message: validationMessage });
        }

        const result = await scholarshipsModel.create({
            name,
            description,
            amount,
            semester_id,
            min_gpa,
            status
        });

        return res.status(201).json({
            message: "Tao hoc bong thanh cong",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao hoc bong",
            error: error.message
        });
    }
};

exports.updateScholarship = async (req, res) => {
    try {
        const { name, description, amount, semester_id, min_gpa, status } = req.body;

        if (!name || amount === undefined || !status) {
            return res.status(400).json({
                message: "Thieu name, amount hoac status"
            });
        }

        const validationMessage = await validateScholarshipPayload(req.body);
        if (validationMessage) {
            return res.status(400).json({ message: validationMessage });
        }

        const result = await scholarshipsModel.update(req.params.id, {
            name,
            description,
            amount,
            semester_id,
            min_gpa,
            status
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay hoc bong"
            });
        }

        return res.json({
            message: "Cap nhat hoc bong thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat hoc bong",
            error: error.message
        });
    }
};

exports.deleteScholarship = async (req, res) => {
    try {
        const result = await scholarshipsModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay hoc bong"
            });
        }

        return res.json({
            message: "Xoa hoc bong thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa hoc bong",
            error: error.message
        });
    }
};

exports.awardScholarship = async (req, res) => {
    try {
        const { scholarship_id, student_id, awarded_date, note, status } = req.body;

        if (!scholarship_id || !student_id || !awarded_date || !status) {
            return res.status(400).json({
                message: "Thieu scholarship_id, student_id, awarded_date hoac status"
            });
        }

        const validationMessage = await validateScholarshipAwardPayload(req.body);
        if (validationMessage) {
            return res.status(400).json({ message: validationMessage });
        }

        const result = await scholarshipsModel.awardScholarship({
            scholarship_id,
            student_id,
            awarded_date,
            note,
            status
        });

        return res.status(201).json({
            message: "Cap hoc bong cho sinh vien thanh cong",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap hoc bong cho sinh vien",
            error: error.message
        });
    }
};

exports.updateScholarshipAward = async (req, res) => {
    try {
        const { scholarship_id, student_id, awarded_date, note, status } = req.body;

        if (!scholarship_id || !student_id || !awarded_date || !status) {
            return res.status(400).json({
                message: "Thieu scholarship_id, student_id, awarded_date hoac status"
            });
        }

        const validationMessage = await validateScholarshipAwardPayload(req.body, req.params.id);
        if (validationMessage) {
            return res.status(400).json({ message: validationMessage });
        }

        const result = await scholarshipsModel.updateAward(req.params.id, {
            scholarship_id,
            student_id,
            awarded_date,
            note,
            status
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay hoc bong da cap"
            });
        }

        return res.json({
            message: "Cap nhat hoc bong da cap thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat hoc bong da cap",
            error: error.message
        });
    }
};

exports.deleteScholarshipAward = async (req, res) => {
    try {
        const result = await scholarshipsModel.removeAward(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay hoc bong da cap"
            });
        }

        return res.json({
            message: "Xoa hoc bong da cap thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa hoc bong da cap",
            error: error.message
        });
    }
};
