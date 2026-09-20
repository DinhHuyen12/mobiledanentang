const graduationRequirementsModel = require("../models/graduationRequirements.model");

exports.getAllGraduationRequirements = async (req, res) => {
    try {
        const data = await graduationRequirementsModel.getAll();
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach dieu kien tot nghiep",
            error: error.message
        });
    }
};

exports.getGraduationRequirementByProgramId = async (req, res) => {
    try {
        const data = await graduationRequirementsModel.getByProgramId(req.params.programId);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay dieu kien tot nghiep"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay dieu kien tot nghiep",
            error: error.message
        });
    }
};

exports.evaluateMyGraduation = async (req, res) => {
    try {
        const data = await graduationRequirementsModel.evaluateForUser(req.user);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay thong tin danh gia tot nghiep"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi danh gia tot nghiep",
            error: error.message
        });
    }
};

exports.evaluateGraduation = async (req, res) => {
    try {
        const studentId = req.query.student_id || null;

        if (!studentId) {
            return res.status(400).json({
                message: "Thieu student_id"
            });
        }

        const data = await graduationRequirementsModel.evaluateForUser(req.user, studentId);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay thong tin danh gia tot nghiep"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi danh gia tot nghiep",
            error: error.message
        });
    }
};

exports.createGraduationRequirement = async (req, res) => {
    try {
        const {
            program_id,
            min_cumulative_gpa,
            min_earned_credits,
            max_failed_subjects,
            required_english_level,
            required_it_level,
            status
        } = req.body;

        if (
            !program_id ||
            min_cumulative_gpa === undefined ||
            min_earned_credits === undefined ||
            max_failed_subjects === undefined ||
            !status
        ) {
            return res.status(400).json({
                message: "Thieu program_id, min_cumulative_gpa, min_earned_credits, max_failed_subjects hoac status"
            });
        }

        const result = await graduationRequirementsModel.create({
            program_id,
            min_cumulative_gpa,
            min_earned_credits,
            max_failed_subjects,
            required_english_level,
            required_it_level,
            status
        });

        return res.status(201).json({
            message: "Tao dieu kien tot nghiep thanh cong",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao dieu kien tot nghiep",
            error: error.message
        });
    }
};

exports.updateGraduationRequirement = async (req, res) => {
    try {
        const {
            program_id,
            min_cumulative_gpa,
            min_earned_credits,
            max_failed_subjects,
            required_english_level,
            required_it_level,
            status
        } = req.body;

        if (
            !program_id ||
            min_cumulative_gpa === undefined ||
            min_earned_credits === undefined ||
            max_failed_subjects === undefined ||
            !status
        ) {
            return res.status(400).json({
                message: "Thieu program_id, min_cumulative_gpa, min_earned_credits, max_failed_subjects hoac status"
            });
        }

        const result = await graduationRequirementsModel.update(req.params.id, {
            program_id,
            min_cumulative_gpa,
            min_earned_credits,
            max_failed_subjects,
            required_english_level,
            required_it_level,
            status
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay dieu kien tot nghiep"
            });
        }

        return res.json({
            message: "Cap nhat dieu kien tot nghiep thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat dieu kien tot nghiep",
            error: error.message
        });
    }
};

exports.deleteGraduationRequirement = async (req, res) => {
    try {
        const result = await graduationRequirementsModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay dieu kien tot nghiep"
            });
        }

        return res.json({
            message: "Xoa dieu kien tot nghiep thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa dieu kien tot nghiep",
            error: error.message
        });
    }
};
