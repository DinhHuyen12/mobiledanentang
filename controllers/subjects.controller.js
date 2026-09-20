const Subject = require("../models/subjects.model");

exports.getAllSubjects = async (req, res) => {
    try {
        const data = await Subject.getAll();
        res.json(data);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.getSubjectById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Subject.getById(id);
        res.json(data);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.createSubject = async (req, res) => {
    try {
        const { subject_code, name, credits, faculty_id } = req.body;

        if (!subject_code || !name || !credits || !faculty_id) {
            return res.status(400).json({
                message: "Thieu subject_code, name, credits hoac faculty_id"
            });
        }

        const result = await Subject.create(req.body);

        res.json({
            message: "Subject created",
            result
        });
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.updateSubject = async (req, res) => {
    try {
        const id = req.params.id;
        const { subject_code, name, credits, faculty_id } = req.body;

        if (!subject_code || !name || !credits || !faculty_id) {
            return res.status(400).json({
                message: "Thieu subject_code, name, credits hoac faculty_id"
            });
        }

        const result = await Subject.update(id, req.body);

        res.json({
            message: "Subject updated",
            result
        });
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await Subject.delete(id);

        res.json({
            message: "Subject deleted",
            result
        });
    } catch (err) {
        res.status(500).json(err);
    }
};
