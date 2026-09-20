const subjectPrerequisitesModel = require("../models/subjectPrerequisites.model");

exports.getAllSubjectPrerequisites = async (req, res) => {
    try {
        const data = await subjectPrerequisitesModel.getAll();
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach mon hoc tien quyet",
            error: error.message
        });
    }
};

exports.getSubjectPrerequisitesBySubjectId = async (req, res) => {
    try {
        const data = await subjectPrerequisitesModel.getBySubjectId(req.params.subjectId);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay mon hoc tien quyet",
            error: error.message
        });
    }
};

exports.createSubjectPrerequisite = async (req, res) => {
    try {
        const { subject_id, prerequisite_id } = req.body;

        if (!subject_id || !prerequisite_id) {
            return res.status(400).json({
                message: "Thieu subject_id hoac prerequisite_id"
            });
        }

        const result = await subjectPrerequisitesModel.create({
            subject_id,
            prerequisite_id
        });

        return res.status(201).json({
            message: "Tao mon hoc tien quyet thanh cong",
            result
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao mon hoc tien quyet",
            error: error.message
        });
    }
};

exports.updateSubjectPrerequisite = async (req, res) => {
    try {
        const { subject_id, prerequisite_id } = req.body;

        if (!subject_id || !prerequisite_id) {
            return res.status(400).json({
                message: "Thieu subject_id hoac prerequisite_id"
            });
        }

        const result = await subjectPrerequisitesModel.update(
            req.params.subjectId,
            req.params.prerequisiteId,
            { subject_id, prerequisite_id }
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay mon hoc tien quyet"
            });
        }

        return res.json({
            message: "Cap nhat mon hoc tien quyet thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat mon hoc tien quyet",
            error: error.message
        });
    }
};

exports.deleteSubjectPrerequisite = async (req, res) => {
    try {
        const result = await subjectPrerequisitesModel.remove(
            req.params.subjectId,
            req.params.prerequisiteId
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay mon hoc tien quyet"
            });
        }

        return res.json({
            message: "Xoa mon hoc tien quyet thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa mon hoc tien quyet",
            error: error.message
        });
    }
};
