const lecturerInfoModel = require("../models/lecturerInfo.model");

exports.getAllLecturerInfo = async (req, res) => {
    try {
        const data = await lecturerInfoModel.getAll();
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi lấy danh sách giảng viên",
            error: error.message
        });
    }
};

exports.getLecturerInfoById = async (req, res) => {
    try {
        const data = await lecturerInfoModel.getById(req.params.id);

        if (!data) {
            return res.status(404).json({
                message: "Không tìm thấy thông tin giảng viên"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi lấy thông tin giảng viên",
            error: error.message
        });
    }
};

exports.createLecturerInfo = async (req, res) => {
    try {
        const { user_id, lecturer_code, academic_rank, specialization } = req.body;

        if (!user_id || !lecturer_code || !academic_rank || !specialization) {
            return res.status(400).json({
                message: "Thiếu user_id, lecturer_code, academic_rank hoặc specialization"
            });
        }

        const result = await lecturerInfoModel.create({
            user_id,
            lecturer_code,
            academic_rank,
            specialization
        });

        return res.status(201).json({
            message: "Tạo thông tin giảng viên thành công",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi tạo thông tin giảng viên",
            error: error.message
        });
    }
};

exports.updateLecturerInfo = async (req, res) => {
    try {
        const { user_id, lecturer_code, academic_rank, specialization } = req.body;

        if (!user_id || !lecturer_code || !academic_rank || !specialization) {
            return res.status(400).json({
                message: "Thiếu user_id, lecturer_code, academic_rank hoặc specialization"
            });
        }

        const result = await lecturerInfoModel.update(req.params.id, {
            user_id,
            lecturer_code,
            academic_rank,
            specialization
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Không tìm thấy thông tin giảng viên"
            });
        }

        return res.json({
            message: "Cập nhật thông tin giảng viên thành công"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi cập nhật thông tin giảng viên",
            error: error.message
        });
    }
};

exports.deleteLecturerInfo = async (req, res) => {
    try {
        const result = await lecturerInfoModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Không tìm thấy thông tin giảng viên"
            });
        }

        return res.json({
            message: "Xóa thông tin giảng viên thành công"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi xóa thông tin giảng viên",
            error: error.message
        });
    }
};