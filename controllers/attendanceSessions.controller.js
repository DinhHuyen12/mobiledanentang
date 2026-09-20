const attendanceSessionsModel = require("../models/attendanceSessions.model");
const { buildWorkbookBuffer } = require("../utils/excel");

const ROLE_ADMIN = 1;
const ROLE_LECTURER = 2;
const ROLE_STUDENT = 3;
const ALLOWED_SESSION_STATUSES = ["open", "closed"];
const ALLOWED_ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"];

const getRoleId = (user) => Number(user?.role_id || user?.role);

const validateSessionStatus = (status) => {
    if (status == null) {
        return {
            ok: true,
            value: "open"
        };
    }

    const normalizedStatus = String(status).trim().toLowerCase();

    if (!ALLOWED_SESSION_STATUSES.includes(normalizedStatus)) {
        return {
            ok: false,
            message: "status cua buoi diem danh chi duoc la open hoac closed"
        };
    }

    return {
        ok: true,
        value: normalizedStatus
    };
};

const ensureCourseSectionOwnership = async (user, courseSectionId) => {
    const roleId = getRoleId(user);

    if (roleId === ROLE_ADMIN) {
        const courseSection = await attendanceSessionsModel.getCourseSectionById(Number(courseSectionId));

        if (!courseSection) {
            return {
                ok: false,
                code: 404,
                message: "Khong tim thay lop hoc phan"
            };
        }

        return {
            ok: true,
            courseSection
        };
    }

    if (roleId !== ROLE_LECTURER) {
        return {
            ok: false,
            code: 403,
            message: "Ban khong co quyen thuc hien thao tac nay"
        };
    }

    const lecturerInfo = await attendanceSessionsModel.getLecturerInfoByUserId(user.id);

    if (!lecturerInfo) {
        return {
            ok: false,
            code: 404,
            message: "Khong tim thay thong tin giang vien"
        };
    }

    const courseSection = await attendanceSessionsModel.getCourseSectionById(Number(courseSectionId));

    if (!courseSection) {
        return {
            ok: false,
            code: 404,
            message: "Khong tim thay lop hoc phan"
        };
    }

    if (Number(courseSection.lecturer_id) !== Number(lecturerInfo.id)) {
        return {
            ok: false,
            code: 403,
            message: "Giang vien chi duoc diem danh lop hoc phan minh phu trach"
        };
    }

    return {
        ok: true,
        courseSection
    };
};

const validateSessionPayload = async (user, payload) => {
    const {
        course_section_id,
        schedule_id,
        session_date,
        start_time,
        end_time,
        status
    } = payload;

    if (!course_section_id || !session_date) {
        return {
            ok: false,
            code: 400,
            message: "Thieu course_section_id hoac session_date"
        };
    }

    const ownershipCheck = await ensureCourseSectionOwnership(user, course_section_id);

    if (!ownershipCheck.ok) {
        return ownershipCheck;
    }

    if (start_time && end_time && start_time >= end_time) {
        return {
            ok: false,
            code: 400,
            message: "start_time phai nho hon end_time"
        };
    }

    if (schedule_id) {
        const schedule = await attendanceSessionsModel.getScheduleById(Number(schedule_id));

        if (!schedule) {
            return {
                ok: false,
                code: 404,
                message: "Khong tim thay lich hoc"
            };
        }

        if (Number(schedule.course_section_id) !== Number(course_section_id)) {
            return {
                ok: false,
                code: 409,
                message: "schedule_id khong thuoc lop hoc phan nay"
            };
        }
    }

    const validatedStatus = validateSessionStatus(status);

    if (!validatedStatus.ok) {
        return {
            ok: false,
            code: 400,
            message: validatedStatus.message
        };
    }

    return {
        ok: true,
        normalizedData: {
            course_section_id: Number(course_section_id),
            schedule_id: schedule_id ? Number(schedule_id) : null,
            session_date,
            start_time: start_time || null,
            end_time: end_time || null,
            room: payload.room || null,
            topic: payload.topic || null,
            status: validatedStatus.value
        }
    };
};

const validateAttendanceRecordsPayload = (records) => {
    if (!Array.isArray(records) || records.length === 0) {
        return {
            ok: false,
            code: 400,
            message: "records phai la mang va khong duoc rong"
        };
    }

    const normalizedRecords = [];

    for (const record of records) {
        if (!record || !record.enrollment_id) {
            return {
                ok: false,
                code: 400,
                message: "Moi record phai co enrollment_id"
            };
        }

        const normalizedStatus = String(record.status || "present").trim().toLowerCase();

        if (!ALLOWED_ATTENDANCE_STATUSES.includes(normalizedStatus)) {
            return {
                ok: false,
                code: 400,
                message: "status diem danh chi duoc la present, absent, late hoac excused"
            };
        }

        normalizedRecords.push({
            enrollment_id: Number(record.enrollment_id),
            student_id: record.student_id != null ? Number(record.student_id) : null,
            status: normalizedStatus,
            check_in_time: record.check_in_time || null,
            note: record.note || null
        });
    }

    return {
        ok: true,
        normalizedRecords
    };
};

exports.getAllAttendanceSessions = async (req, res) => {
    try {
        const data = await attendanceSessionsModel.getAllSessionsForUser(req.user, req.query);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach buoi diem danh",
            error: error.message
        });
    }
};

exports.getAttendanceSessionById = async (req, res) => {
    try {
        const data = await attendanceSessionsModel.getSessionByIdForUser(req.params.id, req.user);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay buoi diem danh"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay buoi diem danh",
            error: error.message
        });
    }
};

exports.createAttendanceSession = async (req, res) => {
    try {
        const validation = await validateSessionPayload(req.user, req.body);

        if (!validation.ok) {
            return res.status(validation.code).json({
                message: validation.message
            });
        }

        const result = await attendanceSessionsModel.create({
            ...validation.normalizedData,
            created_by: req.user.id
        });

        const createdSession = await attendanceSessionsModel.getSessionById(result.insertId);

        return res.status(201).json({
            message: "Tao buoi diem danh thanh cong",
            data: createdSession
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao buoi diem danh",
            error: error.message
        });
    }
};

exports.updateAttendanceSession = async (req, res) => {
    try {
        const currentSession = await attendanceSessionsModel.getSessionById(req.params.id);

        if (!currentSession) {
            return res.status(404).json({
                message: "Khong tim thay buoi diem danh"
            });
        }

        const accessibleSession = await attendanceSessionsModel.getSessionByIdForUser(req.params.id, req.user);

        if (!accessibleSession || getRoleId(req.user) === ROLE_STUDENT) {
            return res.status(403).json({
                message: "Ban khong co quyen cap nhat buoi diem danh"
            });
        }

        const validation = await validateSessionPayload(req.user, {
            course_section_id: req.body.course_section_id || currentSession.course_section_id,
            schedule_id: req.body.schedule_id !== undefined ? req.body.schedule_id : currentSession.schedule_id,
            session_date: req.body.session_date || currentSession.session_date,
            start_time: req.body.start_time !== undefined ? req.body.start_time : currentSession.start_time,
            end_time: req.body.end_time !== undefined ? req.body.end_time : currentSession.end_time,
            room: req.body.room !== undefined ? req.body.room : currentSession.room,
            topic: req.body.topic !== undefined ? req.body.topic : currentSession.topic,
            status: req.body.status !== undefined ? req.body.status : currentSession.status
        });

        if (!validation.ok) {
            return res.status(validation.code).json({
                message: validation.message
            });
        }

        const result = await attendanceSessionsModel.update(req.params.id, validation.normalizedData);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay buoi diem danh"
            });
        }

        const updatedSession = await attendanceSessionsModel.getSessionById(req.params.id);

        return res.json({
            message: "Cap nhat buoi diem danh thanh cong",
            data: updatedSession
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat buoi diem danh",
            error: error.message
        });
    }
};

exports.deleteAttendanceSession = async (req, res) => {
    try {
        const currentSession = await attendanceSessionsModel.getSessionById(req.params.id);

        if (!currentSession) {
            return res.status(404).json({
                message: "Khong tim thay buoi diem danh"
            });
        }

        const accessibleSession = await attendanceSessionsModel.getSessionByIdForUser(req.params.id, req.user);

        if (!accessibleSession || getRoleId(req.user) === ROLE_STUDENT) {
            return res.status(403).json({
                message: "Ban khong co quyen xoa buoi diem danh"
            });
        }

        const result = await attendanceSessionsModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay buoi diem danh"
            });
        }

        return res.json({
            message: "Xoa buoi diem danh thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa buoi diem danh",
            error: error.message
        });
    }
};

exports.getAttendanceSessionRecords = async (req, res) => {
    try {
        const data = await attendanceSessionsModel.getSessionRosterForUser(req.params.id, req.user);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay du lieu diem danh"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach diem danh",
            error: error.message
        });
    }
};

exports.upsertAttendanceSessionRecords = async (req, res) => {
    try {
        const roleId = getRoleId(req.user);

        if (roleId !== ROLE_ADMIN && roleId !== ROLE_LECTURER) {
            return res.status(403).json({
                message: "Ban khong co quyen cap nhat diem danh"
            });
        }

        const session = await attendanceSessionsModel.getSessionByIdForUser(req.params.id, req.user);

        if (!session) {
            return res.status(404).json({
                message: "Khong tim thay buoi diem danh"
            });
        }

        const recordsValidation = validateAttendanceRecordsPayload(req.body.records);

        if (!recordsValidation.ok) {
            return res.status(recordsValidation.code).json({
                message: recordsValidation.message
            });
        }

        const data = await attendanceSessionsModel.upsertSessionRecords(
            Number(req.params.id),
            recordsValidation.normalizedRecords
        );

        return res.json({
            message: "Cap nhat diem danh thanh cong",
            data
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            message: statusCode === 500 ? "Loi cap nhat diem danh" : error.message,
            error: statusCode === 500 ? error.message : undefined
        });
    }
};

exports.exportAttendanceSessionRecords = async (req, res) => {
    try {
        const data = await attendanceSessionsModel.getSessionRosterForUser(req.params.id, req.user);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay du lieu diem danh"
            });
        }

        const attendanceRows = data.records.map((record, index) => ({
            STT: index + 1,
            Sinh_vien: record.student_name,
            Email: record.student_email,
            Enrollment_ID: record.enrollment_id,
            Trang_thai_diem_danh: record.status || "",
            Check_in: record.check_in_time || "",
            Ghi_chu: record.note || "",
            Trang_thai_dang_ky: record.enrollment_status || ""
        }));

        const sessionInfoRows = [
            { Truong: "Buoi diem danh", Gia_tri: data.session.id },
            { Truong: "Lop hoc phan", Gia_tri: data.session.course_section_id },
            { Truong: "Mon hoc", Gia_tri: data.session.subject_name || "" },
            { Truong: "Hoc ky", Gia_tri: data.session.semester_name || "" },
            { Truong: "Ngay hoc", Gia_tri: data.session.session_date || "" },
            { Truong: "Trang thai", Gia_tri: data.session.status || "" }
        ];

        const workbookBuffer = buildWorkbookBuffer([
            { name: "Diem_danh", rows: attendanceRows },
            { name: "Thong_tin_buoi", rows: sessionInfoRows }
        ]);
        const fileName = `diem-danh-session-${req.params.id}.xlsx`;

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        return res.send(workbookBuffer);
    } catch (error) {
        return res.status(500).json({
            message: "Loi export danh sach diem danh",
            error: error.message
        });
    }
};
