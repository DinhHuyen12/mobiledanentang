const CourseSection = require("../models/courseSections.model");

exports.getAll = async (req, res) => {
    try {
        const data = await CourseSection.getAll(req.user);
        res.json(data);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.getById = async (req, res) => {
    try {
        const data = await CourseSection.getById(req.params.id, req.user);
        res.json(data);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.getRegistrationDisplayInfo = async (req, res) => {
    try {
        const data = await CourseSection.getRegistrationDisplayInfo(req.user);
        res.json(data);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.create = async (req, res) => {
    try {
        const result = await CourseSection.create(req.body);
        res.json({
            message: "Course section created",
            result
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({
            message: err.statusCode ? err.message : "Loi tao lop hoc phan",
            error: err.statusCode ? undefined : err.message
        });
    }
};

exports.update = async (req, res) => {
    try {
        const result = await CourseSection.update(req.params.id, req.body);
        res.json({
            message: "Course section updated",
            result
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({
            message: err.statusCode ? err.message : "Loi cap nhat lop hoc phan",
            error: err.statusCode ? undefined : err.message
        });
    }
};

exports.delete = async (req, res) => {
    try {
        const result = await CourseSection.delete(req.params.id);
        res.json({
            message: "Course section deleted",
            result
        });
    } catch (err) {
        res.status(500).json(err);
    }
};
