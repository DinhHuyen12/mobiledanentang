const Faculty = require("../models/facultyModel");

exports.getFaculties = async (req, res) => {
    try {
        const data = await Faculty.getAll();
        res.json(data);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.getFacultyById = async (req, res) => {
    try {
        const data = await Faculty.getById(req.params.id);
        res.json(data);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.createFaculty = async (req, res) => {
    try {
        await Faculty.create(req.body);
        res.json({ message: "Faculty created" });
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.updateFaculty = async (req, res) => {
    try {
        await Faculty.update(req.params.id, req.body);
        res.json({ message: "Faculty updated" });
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.deleteFaculty = async (req, res) => {
    try {
        await Faculty.delete(req.params.id);
        res.json({ message: "Faculty deleted" });
    } catch (err) {
        res.status(500).json(err);
    }
};