const Role = require("../models/roleModel");

exports.getRoles = async (req, res) => {
    try {

        const roles = await Role.getAll();

        res.json(roles);

    } catch (err) {
        res.status(500).json(err);
    }
};


exports.getRoleById = async (req, res) => {
    try {

        const role = await Role.getById(req.params.id);

        res.json(role);

    } catch (err) {
        res.status(500).json(err);
    }
};


exports.createRole = async (req, res) => {
    try {

        await Role.create(req.body);

        res.json({
            message: "Role created"
        });

    } catch (err) {
        res.status(500).json(err);
    }
};


exports.updateRole = async (req, res) => {
    try {

        await Role.update(req.params.id, req.body);

        res.json({
            message: "Role updated"
        });

    } catch (err) {
        res.status(500).json(err);
    }
};


exports.deleteRole = async (req, res) => {
    try {

        await Role.delete(req.params.id);

        res.json({
            message: "Role deleted"
        });

    } catch (err) {
        res.status(500).json(err);
    }
};