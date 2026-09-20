const studentStatusRecordsModel = require("../models/studentStatusRecords.model");

exports.getAllStudentStatusRecords = async (req, res) => {
    try {
        const data = await studentStatusRecordsModel.getAllForUser(req.user);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach trang thai hoc vu",
            error: error.message
        });
    }
};

exports.getMyStudentStatusRecords = async (req, res) => {
    try {
        const data = await studentStatusRecordsModel.getAllForUser(req.user);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay lich su hoc vu cua toi",
            error: error.message
        });
    }
};

exports.getStudentStatusRecordById = async (req, res) => {
    try {
        const data = await studentStatusRecordsModel.getByIdForUser(req.params.id, req.user);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay ban ghi trang thai hoc vu"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay ban ghi trang thai hoc vu",
            error: error.message
        });
    }
};

exports.createStudentStatusRecord = async (req, res) => {
    try {
        const {
            student_id,
            record_type,
            from_class_id,
            to_class_id,
            effective_date,
            end_date,
            reason,
            decision_no,
            status,
            approved_by
        } = req.body;

        if (!student_id || !record_type || !effective_date || !status) {
            return res.status(400).json({
                message: "Thieu student_id, record_type, effective_date hoac status"
            });
        }

        const result = await studentStatusRecordsModel.create({
            student_id,
            record_type,
            from_class_id,
            to_class_id,
            effective_date,
            end_date,
            reason,
            decision_no,
            status,
            approved_by
        });

        return res.status(201).json({
            message: "Tao ban ghi trang thai hoc vu thanh cong",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao ban ghi trang thai hoc vu",
            error: error.message
        });
    }
};

exports.updateStudentStatusRecord = async (req, res) => {
    try {
        const {
            student_id,
            record_type,
            from_class_id,
            to_class_id,
            effective_date,
            end_date,
            reason,
            decision_no,
            status,
            approved_by
        } = req.body;

        if (!student_id || !record_type || !effective_date || !status) {
            return res.status(400).json({
                message: "Thieu student_id, record_type, effective_date hoac status"
            });
        }

        const result = await studentStatusRecordsModel.update(req.params.id, {
            student_id,
            record_type,
            from_class_id,
            to_class_id,
            effective_date,
            end_date,
            reason,
            decision_no,
            status,
            approved_by
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay ban ghi trang thai hoc vu"
            });
        }

        return res.json({
            message: "Cap nhat ban ghi trang thai hoc vu thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat ban ghi trang thai hoc vu",
            error: error.message
        });
    }
};

exports.deleteStudentStatusRecord = async (req, res) => {
    try {
        const result = await studentStatusRecordsModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay ban ghi trang thai hoc vu"
            });
        }

        return res.json({
            message: "Xoa ban ghi trang thai hoc vu thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa ban ghi trang thai hoc vu",
            error: error.message
        });
    }
};
