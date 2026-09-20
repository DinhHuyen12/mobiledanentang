const academicYearsModel = require("../models/academicYears.model");

exports.getAllAcademicYears = async (req, res) => {
    try {
        const data = await academicYearsModel.getAll();
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi lấy danh sách năm học",
            error: error.message
        });
    }
};

exports.getAcademicYearById = async (req, res) => {
    try {
        const data = await academicYearsModel.getById(req.params.id);

        if (!data) {
            return res.status(404).json({ message: "Không tìm thấy năm học" });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi lấy năm học",
            error: error.message
        });
    }
};

exports.createAcademicYear = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Thiếu tên năm học" });
        }

        const result = await academicYearsModel.create(name);

        return res.status(201).json({
            message: "Tạo năm học thành công",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi tạo năm học",
            error: error.message
        });
    }
};

exports.updateAcademicYear = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Thiếu tên năm học" });
        }

        const result = await academicYearsModel.update(req.params.id, name);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy năm học" });
        }

        return res.json({ message: "Cập nhật năm học thành công" });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi cập nhật năm học",
            error: error.message
        });
    }
};

exports.deleteAcademicYear = async (req, res) => {
    try {
        const result = await academicYearsModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy năm học" });
        }

        return res.json({ message: "Xóa năm học thành công" });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi xóa năm học",
            error: error.message
        });
    }
};