const classModel = require("../models/classes.model");

exports.getAllClasses = async (req, res) => {
    try {
        const data = await classModel.getAll();
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi lấy danh sách lớp",
            error: error.message
        });
    }
};

exports.getClassById = async (req, res) => {
    try {
        const data = await classModel.getById(req.params.id);

        if (!data) {
            return res.status(404).json({
                message: "Không tìm thấy lớp"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi lấy lớp",
            error: error.message
        });
    }
};

exports.createClass = async (req, res) => {
    try {
        const { name, faculty_id, academic_year_id } = req.body;

        if (!name || !faculty_id || !academic_year_id) {
            return res.status(400).json({
                message: "Thiếu name, faculty_id hoặc academic_year_id"
            });
        }

        const result = await classModel.create({
            name,
            faculty_id,
            academic_year_id
        });

        return res.status(201).json({
            message: "Tạo lớp thành công",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi tạo lớp",
            error: error.message
        });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const { name, faculty_id, academic_year_id } = req.body;

        if (!name || !faculty_id || !academic_year_id) {
            return res.status(400).json({
                message: "Thiếu name, faculty_id hoặc academic_year_id"
            });
        }

        const result = await classModel.update(req.params.id, {
            name,
            faculty_id,
            academic_year_id
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Không tìm thấy lớp"
            });
        }

        return res.json({
            message: "Cập nhật lớp thành công"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi cập nhật lớp",
            error: error.message
        });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const result = await classModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Không tìm thấy lớp"
            });
        }

        return res.json({
            message: "Xóa lớp thành công"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi xóa lớp",
            error: error.message
        });
    }
};