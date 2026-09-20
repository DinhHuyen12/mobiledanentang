const schedulesModel = require("../models/schedules.model");

const ROLE_ADMIN = 1;
const ROLE_LECTURER = 2;

const getRoleId = (user) => Number(user?.role_id || user?.role);

const ensureLecturerOwnsCourseSection = async (req, courseSectionId) => {
    const roleId = getRoleId(req.user);

    if (roleId === ROLE_ADMIN) {
        return { ok: true };
    }

    if (roleId !== ROLE_LECTURER) {
        return {
            ok: false,
            code: 403,
            message: "Ban khong co quyen thuc hien thao tac nay"
        };
    }

    const lecturerInfo = await schedulesModel.getLecturerInfoByUserId(req.user.id);

    if (!lecturerInfo) {
        return {
            ok: false,
            code: 404,
            message: "Khong tim thay thong tin giang vien"
        };
    }

    const courseSection = await schedulesModel.getCourseSectionById(Number(courseSectionId));

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
            message: "Giang vien chi duoc quan ly lich cua lop hoc phan minh phu trach"
        };
    }

    return {
        ok: true,
        courseSection
    };
};

exports.getAllSchedules = async (req, res) => {
    try {
        const data = await schedulesModel.getAllForUser(req.user);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach lich hoc",
            error: error.message
        });
    }
};

exports.getScheduleById = async (req, res) => {
    try {
        const data = await schedulesModel.getById(req.params.id);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay lich hoc"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay lich hoc",
            error: error.message
        });
    }
};

exports.createSchedule = async (req, res) => {
    try {
        const { course_section_id, day_of_week, start_time, end_time, room } = req.body;

        if (!course_section_id || !day_of_week || !start_time || !end_time) {
            return res.status(400).json({
                message: "Thieu course_section_id, day_of_week, start_time hoac end_time"
            });
        }

        const ownershipCheck = await ensureLecturerOwnsCourseSection(req, course_section_id);

        if (!ownershipCheck.ok) {
            return res.status(ownershipCheck.code).json({
                message: ownershipCheck.message
            });
        }

        const validation = await schedulesModel.validateSchedulePayload({
            course_section_id: Number(course_section_id),
            day_of_week,
            start_time,
            end_time,
            room
        });

        if (!validation.ok) {
            return res.status(validation.code).json({
                message: validation.message
            });
        }

        const result = await schedulesModel.create({
            course_section_id: Number(course_section_id),
            day_of_week,
            start_time,
            end_time,
            room
        });

        return res.status(201).json({
            message: "Tao lich hoc thanh cong",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao lich hoc",
            error: error.message
        });
    }
};

exports.updateSchedule = async (req, res) => {
    try {
        const currentSchedule = await schedulesModel.getScheduleById(req.params.id);

        if (!currentSchedule) {
            return res.status(404).json({
                message: "Khong tim thay lich hoc"
            });
        }

        const nextCourseSectionId = Number(req.body.course_section_id || currentSchedule.course_section_id);
        const nextDayOfWeek = req.body.day_of_week || currentSchedule.day_of_week;
        const nextStartTime = req.body.start_time || currentSchedule.start_time;
        const nextEndTime = req.body.end_time || currentSchedule.end_time;
        const nextRoom = req.body.room !== undefined ? req.body.room : currentSchedule.room;

        const ownershipCheck = await ensureLecturerOwnsCourseSection(req, nextCourseSectionId);

        if (!ownershipCheck.ok) {
            return res.status(ownershipCheck.code).json({
                message: ownershipCheck.message
            });
        }

        const validation = await schedulesModel.validateSchedulePayload(
            {
                course_section_id: nextCourseSectionId,
                day_of_week: nextDayOfWeek,
                start_time: nextStartTime,
                end_time: nextEndTime,
                room: nextRoom
            },
            Number(req.params.id)
        );

        if (!validation.ok) {
            return res.status(validation.code).json({
                message: validation.message
            });
        }

        const result = await schedulesModel.update(req.params.id, {
            course_section_id: nextCourseSectionId,
            day_of_week: nextDayOfWeek,
            start_time: nextStartTime,
            end_time: nextEndTime,
            room: nextRoom
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay lich hoc"
            });
        }

        return res.json({
            message: "Cap nhat lich hoc thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat lich hoc",
            error: error.message
        });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const result = await schedulesModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay lich hoc"
            });
        }

        return res.json({
            message: "Xoa lich hoc thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa lich hoc",
            error: error.message
        });
    }
};
