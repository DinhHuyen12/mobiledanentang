const academicAdvisorsModel = require("../models/academicAdvisors.model");

exports.getAllAcademicAdvisors = async (req, res) => {
    try {
        const data = await academicAdvisorsModel.getAllForUser(req.user);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach co van hoc tap",
            error: error.message
        });
    }
};

exports.getMyAcademicAdvisors = async (req, res) => {
    try {
        const data = await academicAdvisorsModel.getAllForUser(req.user);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay co van hoc tap cua toi",
            error: error.message
        });
    }
};

exports.getAcademicAdvisorById = async (req, res) => {
    try {
        const data = await academicAdvisorsModel.getByIdForUser(req.params.id, req.user);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay phan cong co van hoc tap"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay phan cong co van hoc tap",
            error: error.message
        });
    }
};

exports.createAcademicAdvisor = async (req, res) => {
    try {
        const {
            lecturer_id,
            class_id,
            student_id,
            start_date,
            end_date,
            note,
            status
        } = req.body;

        if (!lecturer_id || !start_date || !status) {
            return res.status(400).json({
                message: "Thieu lecturer_id, start_date hoac status"
            });
        }

        if (!class_id && !student_id) {
            return res.status(400).json({
                message: "Can it nhat class_id hoac student_id"
            });
        }

        const result = await academicAdvisorsModel.create({
            lecturer_id,
            class_id,
            student_id,
            start_date,
            end_date,
            note,
            status
        });

        return res.status(201).json({
            message: "Tao phan cong co van hoc tap thanh cong",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao phan cong co van hoc tap",
            error: error.message
        });
    }
};

exports.updateAcademicAdvisor = async (req, res) => {
    try {
        const {
            lecturer_id,
            class_id,
            student_id,
            start_date,
            end_date,
            note,
            status
        } = req.body;

        if (!lecturer_id || !start_date || !status) {
            return res.status(400).json({
                message: "Thieu lecturer_id, start_date hoac status"
            });
        }

        if (!class_id && !student_id) {
            return res.status(400).json({
                message: "Can it nhat class_id hoac student_id"
            });
        }

        const result = await academicAdvisorsModel.update(req.params.id, {
            lecturer_id,
            class_id,
            student_id,
            start_date,
            end_date,
            note,
            status
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay phan cong co van hoc tap"
            });
        }

        return res.json({
            message: "Cap nhat phan cong co van hoc tap thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat phan cong co van hoc tap",
            error: error.message
        });
    }
};

exports.deleteAcademicAdvisor = async (req, res) => {
    try {
        const result = await academicAdvisorsModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay phan cong co van hoc tap"
            });
        }

        return res.json({
            message: "Xoa phan cong co van hoc tap thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa phan cong co van hoc tap",
            error: error.message
        });
    }
};
