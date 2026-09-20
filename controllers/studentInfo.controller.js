const studentInfoModel = require("../models/studentInfo.model");
const studentDocumentsModel = require("../models/studentDocuments.model");
const { parseWorkbookRows } = require("../utils/excel");

const getRoleId = (user) => Number(user?.role_id || user?.role);
const enrichDocumentFileUrl = (document) => ({
    ...document,
    file_url: `/${String(document.file_path || "").replace(/\\/g, "/")}`
});

const resolveStudentScope = async (req, studentIdParam) => {
    const roleId = getRoleId(req.user);

    if (roleId === 1) {
        return studentInfoModel.getById(studentIdParam);
    }

    if (roleId === 3) {
        const myStudentInfo = await studentInfoModel.getStudentInfoByUserId(req.user.id);

        if (!myStudentInfo) {
            return null;
        }

        if (studentIdParam && Number(studentIdParam) !== Number(myStudentInfo.id)) {
            return null;
        }

        return myStudentInfo;
    }

    return null;
};

exports.getAllStudentInfo = async (req, res) => {
    try {
        const data = await studentInfoModel.getAllForUser(req.user);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach sinh vien",
            error: error.message
        });
    }
};

exports.getStudentStatuses = async (req, res) => {
    return res.json(studentInfoModel.STUDENT_STATUSES);
};

exports.getStudentInfoById = async (req, res) => {
    try {
        const data = await studentInfoModel.getByIdForUser(req.params.id, req.user);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay sinh vien"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay thong tin sinh vien",
            error: error.message
        });
    }
};

exports.updateStudentStatus = async (req, res) => {
    try {
        const { status, effective_date, reason, decision_no } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Thieu status"
            });
        }

        const result = await studentInfoModel.updateStudentStatus(req.params.id, status, req.user.id, {
            effective_date,
            reason,
            decision_no
        });

        if (!result) {
            return res.status(404).json({
                message: "Khong tim thay sinh vien"
            });
        }

        return res.json({
            message: "Cap nhat trang thai sinh vien thanh cong",
            data: result
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            message: statusCode === 500 ? "Loi cap nhat trang thai sinh vien" : error.message,
            error: statusCode === 500 ? error.message : undefined
        });
    }
};

exports.getMyStudentInfo = async (req, res) => {
    try {
        const data = await studentInfoModel.getStudentInfoByUserId(req.user.id);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay ho so sinh vien"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay ho so sinh vien",
            error: error.message
        });
    }
};

exports.createStudentInfo = async (req, res) => {
    try {
        const { user_id, class_id, enrollment_date, status } = req.body;

        if (!user_id || !class_id || !enrollment_date || !status) {
            return res.status(400).json({
                message: "Thieu user_id, class_id, enrollment_date hoac status"
            });
        }

        const result = await studentInfoModel.create({
            user_id,
            class_id,
            enrollment_date,
            status
        });

        return res.status(201).json({
            message: "Tao thong tin sinh vien thanh cong",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao thong tin sinh vien",
            error: error.message
        });
    }
};

exports.importStudentsFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Vui long tai len file Excel"
            });
        }

        const rows = parseWorkbookRows(req.file.buffer);

        if (!rows.length) {
            return res.status(400).json({
                message: "File Excel khong co du lieu"
            });
        }

        const result = await studentInfoModel.importStudents(rows);

        return res.status(201).json({
            message: "Import sinh vien hoan tat",
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi import sinh vien tu Excel",
            error: error.message
        });
    }
};

exports.getMyDocuments = async (req, res) => {
    try {
        const studentInfo = await studentInfoModel.getStudentInfoByUserId(req.user.id);

        if (!studentInfo) {
            return res.status(404).json({
                message: "Khong tim thay ho so sinh vien"
            });
        }

        const documents = await studentDocumentsModel.getAllByStudentId(studentInfo.id);
        return res.json(documents.map(enrichDocumentFileUrl));
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay tai lieu sinh vien",
            error: error.message
        });
    }
};

exports.getStudentDocuments = async (req, res) => {
    try {
        const studentInfo = await resolveStudentScope(req, req.params.id);

        if (!studentInfo) {
            return res.status(404).json({
                message: "Khong tim thay ho so sinh vien hoac ban khong co quyen truy cap"
            });
        }

        const documents = await studentDocumentsModel.getAllByStudentId(studentInfo.id);
        return res.json(documents.map(enrichDocumentFileUrl));
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay minh chung ho so",
            error: error.message
        });
    }
};

exports.uploadStudentDocuments = async (req, res) => {
    try {
        const studentInfo = await resolveStudentScope(req, req.params.id);

        if (!studentInfo) {
            return res.status(404).json({
                message: "Khong tim thay ho so sinh vien hoac ban khong co quyen truy cap"
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "Vui long tai len it nhat 1 file"
            });
        }

        const createdDocuments = await studentDocumentsModel.createMany(
            req.files.map((file) => ({
                student_id: studentInfo.id,
                document_type: req.body.document_type || "hoso",
                title: req.body.title || file.originalname,
                note: req.body.note || null,
                file_name: file.filename,
                original_name: file.originalname,
                mime_type: file.mimetype,
                file_size: file.size,
                file_path: `uploads/student-documents/${file.filename}`,
                uploaded_by: req.user.id
            }))
        );

        const data = createdDocuments.map(enrichDocumentFileUrl);

        return res.status(201).json({
            message: "Tai len minh chung ho so thanh cong",
            data
        });
    } catch (error) {
        if (req.files?.length) {
            const fs = require("fs");
            const path = require("path");

            for (const file of req.files) {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(path.resolve(file.path));
                }
            }
        }

        return res.status(500).json({
            message: "Loi tai len minh chung ho so",
            error: error.message
        });
    }
};

exports.deleteStudentDocument = async (req, res) => {
    try {
        const document = await studentDocumentsModel.getById(req.params.documentId);

        if (!document) {
            return res.status(404).json({
                message: "Khong tim thay tai lieu"
            });
        }

        const roleId = getRoleId(req.user);

        if (roleId !== 1) {
            const studentInfo = await studentInfoModel.getStudentInfoByUserId(req.user.id);

            if (!studentInfo || Number(studentInfo.id) !== Number(document.student_id)) {
                return res.status(403).json({
                    message: "Ban khong co quyen xoa tai lieu nay"
                });
            }
        }

        await studentDocumentsModel.remove(req.params.documentId);

        return res.json({
            message: "Xoa tai lieu thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa tai lieu",
            error: error.message
        });
    }
};

exports.updateStudentInfo = async (req, res) => {
    try {
        const { user_id, class_id, enrollment_date, status } = req.body;

        if (!user_id || !class_id || !enrollment_date || !status) {
            return res.status(400).json({
                message: "Thieu user_id, class_id, enrollment_date hoac status"
            });
        }

        const result = await studentInfoModel.update(req.params.id, {
            user_id,
            class_id,
            enrollment_date,
            status
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay sinh vien"
            });
        }

        return res.json({
            message: "Cap nhat thong tin sinh vien thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat thong tin sinh vien",
            error: error.message
        });
    }
};

exports.deleteStudentInfo = async (req, res) => {
    try {
        const result = await studentInfoModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay sinh vien"
            });
        }

        return res.json({
            message: "Xoa thong tin sinh vien thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa thong tin sinh vien",
            error: error.message
        });
    }
};
