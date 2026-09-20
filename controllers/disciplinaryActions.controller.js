const disciplinaryActionsModel = require("../models/disciplinaryActions.model");
const {
    DISCIPLINARY_LEVELS,
    DISCIPLINARY_STATUSES,
    isOneOf,
    isValidDateString
} = require("../utils/validation");

const validateDisciplinaryPayload = async ({ student_id, semester_id, level, decision_date, status, decided_by }) => {
    if (!(await disciplinaryActionsModel.studentExists(Number(student_id)))) {
        return "Khong tim thay sinh vien";
    }

    if (!(await disciplinaryActionsModel.semesterExists(semester_id))) {
        return "Khong tim thay hoc ky";
    }

    if (!(await disciplinaryActionsModel.userExists(decided_by))) {
        return "Khong tim thay nguoi ra quyet dinh";
    }

    if (!isOneOf(level, DISCIPLINARY_LEVELS)) {
        return "level ky luat khong hop le";
    }

    if (!isOneOf(status, DISCIPLINARY_STATUSES)) {
        return "status ky luat khong hop le";
    }

    if (!isValidDateString(decision_date)) {
        return "decision_date khong hop le, can theo dinh dang YYYY-MM-DD";
    }

    return null;
};

exports.getAllDisciplinaryActions = async (req, res) => {
    try {
        const data = await disciplinaryActionsModel.getAllForUser(req.user);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach ky luat",
            error: error.message
        });
    }
};

exports.getMyDisciplinaryActions = async (req, res) => {
    try {
        const data = await disciplinaryActionsModel.getAllForUser(req.user);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay ky luat cua toi",
            error: error.message
        });
    }
};

exports.getDisciplinaryActionById = async (req, res) => {
    try {
        const data = await disciplinaryActionsModel.getByIdForUser(req.params.id, req.user);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay quyet dinh ky luat"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay quyet dinh ky luat",
            error: error.message
        });
    }
};

exports.createDisciplinaryAction = async (req, res) => {
    try {
        const {
            student_id,
            semester_id,
            title,
            description,
            level,
            decision_date,
            status,
            decided_by
        } = req.body;

        if (!student_id || !title || !level || !decision_date || !status) {
            return res.status(400).json({
                message: "Thieu student_id, title, level, decision_date hoac status"
            });
        }

        const validationMessage = await validateDisciplinaryPayload(req.body);
        if (validationMessage) {
            return res.status(400).json({ message: validationMessage });
        }

        const result = await disciplinaryActionsModel.create({
            student_id,
            semester_id,
            title,
            description,
            level,
            decision_date,
            status,
            decided_by
        });

        return res.status(201).json({
            message: "Tao quyet dinh ky luat thanh cong",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao quyet dinh ky luat",
            error: error.message
        });
    }
};

exports.updateDisciplinaryAction = async (req, res) => {
    try {
        const {
            student_id,
            semester_id,
            title,
            description,
            level,
            decision_date,
            status,
            decided_by
        } = req.body;

        if (!student_id || !title || !level || !decision_date || !status) {
            return res.status(400).json({
                message: "Thieu student_id, title, level, decision_date hoac status"
            });
        }

        const validationMessage = await validateDisciplinaryPayload(req.body);
        if (validationMessage) {
            return res.status(400).json({ message: validationMessage });
        }

        const result = await disciplinaryActionsModel.update(req.params.id, {
            student_id,
            semester_id,
            title,
            description,
            level,
            decision_date,
            status,
            decided_by
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay quyet dinh ky luat"
            });
        }

        return res.json({
            message: "Cap nhat quyet dinh ky luat thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat quyet dinh ky luat",
            error: error.message
        });
    }
};

exports.deleteDisciplinaryAction = async (req, res) => {
    try {
        const result = await disciplinaryActionsModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay quyet dinh ky luat"
            });
        }

        return res.json({
            message: "Xoa quyet dinh ky luat thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa quyet dinh ky luat",
            error: error.message
        });
    }
};
