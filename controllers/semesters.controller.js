const semesterModel = require("../models/semesters.model");

exports.getAllSemesters = async (req, res) => {
    try {
        const data = await semesterModel.getAll();
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi lấy danh sách học kỳ",
            error: error.message
        });
    }
};

exports.getSemesterById = async (req, res) => {
    try {
        const data = await semesterModel.getById(req.params.id);

        if (!data) {
            return res.status(404).json({
                message: "Không tìm thấy học kỳ"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi lấy học kỳ",
            error: error.message
        });
    }
};

exports.createSemester = async (req, res) => {
    try {
        const { name, academic_year_id } = req.body;

        if (!name || !academic_year_id) {
            return res.status(400).json({
                message: "Thiếu name hoặc academic_year_id"
            });
        }

        const result = await semesterModel.create({ name, academic_year_id });

        return res.status(201).json({
            message: "Tạo học kỳ thành công",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi tạo học kỳ",
            error: error.message
        });
    }
};

exports.updateSemester = async (req, res) => {
    try {
        const { name, academic_year_id } = req.body;

        if (!name || !academic_year_id) {
            return res.status(400).json({
                message: "Thiếu name hoặc academic_year_id"
            });
        }

        const result = await semesterModel.update(req.params.id, {
            name,
            academic_year_id
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Không tìm thấy học kỳ"
            });
        }

        return res.json({
            message: "Cập nhật học kỳ thành công"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi cập nhật học kỳ",
            error: error.message
        });
    }
};

exports.deleteSemester = async (req, res) => {
    try {
        const result = await semesterModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Không tìm thấy học kỳ"
            });
        }

        return res.json({
            message: "Xóa học kỳ thành công"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi xóa học kỳ",
            error: error.message
        });
    }
};