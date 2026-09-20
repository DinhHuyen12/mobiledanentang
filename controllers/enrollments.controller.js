const enrollmentsModel = require("../models/enrollments.model");
const { ENROLLMENT_STATUSES, isOneOf } = require("../utils/validation");

const ROLE_ADMIN = 1;
const ROLE_STUDENT = 3;
const STUDENT_ALLOWED_UPDATE_STATUSES = ["pending", "cancelled", "canceled", "dropped"];

const getRoleId = (user) => Number(user?.role_id || user?.role);

const resolveStudentIdForRequest = async (req, allowBodyStudentId = false) => {
    const roleId = getRoleId(req.user);

    if (roleId === ROLE_STUDENT) {
        const studentInfo = await enrollmentsModel.getStudentInfoByUserId(req.user.id);

        if (!studentInfo) {
            return {
                error: {
                    code: 404,
                    message: "Khong tim thay thong tin hoc sinh"
                }
            };
        }

        return { studentId: studentInfo.id };
    }

    if (roleId === ROLE_ADMIN && allowBodyStudentId) {
        if (!req.body.student_id) {
            return {
                error: {
                    code: 400,
                    message: "Thieu student_id"
                }
            };
        }

        const studentInfo = await enrollmentsModel.getStudentInfoById(Number(req.body.student_id));

        if (!studentInfo) {
            return {
                error: {
                    code: 404,
                    message: "Khong tim thay thong tin hoc sinh"
                }
            };
        }

        return { studentId: studentInfo.id };
    }

    return {
        error: {
            code: 403,
            message: "Ban khong co quyen thuc hien thao tac nay"
        }
    };
};

exports.getAllEnrollments = async (req, res) => {
    try {
        const data = await enrollmentsModel.getAllForUser(req.user);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach dang ky hoc",
            error: error.message
        });
    }
};

exports.getEnrollmentById = async (req, res) => {
    try {
        const data = await enrollmentsModel.getByIdForUser(req.params.id, req.user);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay dang ky hoc"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay dang ky hoc",
            error: error.message
        });
    }
};

exports.createEnrollment = async (req, res) => {
    try {
        const roleId = getRoleId(req.user);
        const { course_section_id, class_id } = req.body;

        if (!course_section_id) {
            return res.status(400).json({
                message: "Thieu course_section_id"
            });
        }

        if (roleId === ROLE_ADMIN && class_id) {
            const students = await enrollmentsModel.getActiveStudentsByClassId(Number(class_id));

            if (students.length === 0) {
                return res.status(404).json({
                    message: "Khong tim thay sinh vien active trong lop"
                });
            }

            const created = [];
            const skipped = [];

            for (const student of students) {
                const validation = await enrollmentsModel.validateEnrollmentPayload(
                    student.id,
                    Number(course_section_id)
                );

                if (!validation.ok) {
                    skipped.push({
                        student_id: student.id,
                        message: validation.message
                    });
                    continue;
                }

                const result = await enrollmentsModel.create({
                    student_id: student.id,
                    course_section_id: Number(course_section_id),
                    status: "active"
                });

                created.push({
                    id: result.insertId,
                    student_id: student.id,
                    course_section_id: Number(course_section_id),
                    status: "active"
                });
            }

            return res.status(201).json({
                message: "Xep lich hoc cho lop thanh cong",
                data: {
                    class_id: Number(class_id),
                    course_section_id: Number(course_section_id),
                    created,
                    skipped
                }
            });
        }

        const requestedStatus = req.body.status || "active";

        if (!isOneOf(requestedStatus, ENROLLMENT_STATUSES)) {
            return res.status(400).json({
                message: "status khong hop le"
            });
        }

        const resolvedStudent = await resolveStudentIdForRequest(req, true);

        if (resolvedStudent.error) {
            return res.status(resolvedStudent.error.code).json({
                message: resolvedStudent.error.message
            });
        }

        const validation = await enrollmentsModel.validateEnrollmentPayload(
            resolvedStudent.studentId,
            Number(course_section_id)
        );

        if (!validation.ok) {
            return res.status(validation.code).json({
                message: validation.message
            });
        }

        const enrollmentClassification = await enrollmentsModel.getEnrollmentClassificationByStudentAndCourseSection(
            resolvedStudent.studentId,
            Number(course_section_id)
        );

        if (roleId === ROLE_STUDENT && enrollmentClassification.enrollment_type === "hoc_di") {
            return res.status(403).json({
                message: "Sinh vien chi duoc dang ky hoc lai hoac hoc cai thien. Hoc di do admin xep lich hoc cho lop."
            });
        }

        const status = roleId === ROLE_STUDENT ? "pending" : requestedStatus;

        const result = await enrollmentsModel.create({
            student_id: resolvedStudent.studentId,
            course_section_id: Number(course_section_id),
            status
        });

        return res.status(201).json({
            message: roleId === ROLE_STUDENT
                ? "Gui dang ky hoc thanh cong, cho admin duyet"
                : "Tao dang ky hoc thanh cong",
            id: result.insertId,
            data: {
                student_id: resolvedStudent.studentId,
                course_section_id: Number(course_section_id),
                status,
                is_retake: enrollmentClassification.is_retake,
                is_improvement: enrollmentClassification.is_improvement,
                enrollment_type: enrollmentClassification.enrollment_type,
                is_current_registration: true
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao dang ky hoc",
            error: error.message
        });
    }
};

exports.updateEnrollment = async (req, res) => {
    try {
        const roleId = getRoleId(req.user);
        const currentEnrollment = await enrollmentsModel.getByIdForUser(req.params.id, req.user);

        if (!currentEnrollment) {
            return res.status(404).json({
                message: "Khong tim thay dang ky hoc"
            });
        }

        const nextCourseSectionId = Number(req.body.course_section_id || currentEnrollment.course_section_id);
        const nextStatus = req.body.status || currentEnrollment.status || "active";

        let nextStudentId = currentEnrollment.student_id;

        if (roleId === ROLE_ADMIN && req.body.student_id) {
            nextStudentId = Number(req.body.student_id);
        }

        if (roleId === ROLE_STUDENT && req.body.student_id && Number(req.body.student_id) !== Number(currentEnrollment.student_id)) {
            return res.status(403).json({
                message: "Sinh vien khong duoc thay doi student_id"
            });
        }

        if (roleId === ROLE_STUDENT && !STUDENT_ALLOWED_UPDATE_STATUSES.includes(String(nextStatus).toLowerCase())) {
            return res.status(403).json({
                message: "Sinh vien khong duoc tu duyet dang ky hoc"
            });
        }

        if (!isOneOf(nextStatus, ENROLLMENT_STATUSES)) {
            return res.status(400).json({
                message: "status khong hop le"
            });
        }

        const normalizedStatus = String(nextStatus).toLowerCase();
        const shouldValidateCapacityAndConflict =
            normalizedStatus !== "cancelled" &&
            normalizedStatus !== "canceled" &&
            normalizedStatus !== "dropped";

        if (shouldValidateCapacityAndConflict) {
            const validation = await enrollmentsModel.validateEnrollmentPayload(
                nextStudentId,
                nextCourseSectionId,
                Number(req.params.id)
            );

            if (!validation.ok) {
                return res.status(validation.code).json({
                    message: validation.message
                });
            }
        }

        const enrollmentClassification = await enrollmentsModel.getEnrollmentClassificationByStudentAndCourseSection(
            nextStudentId,
            nextCourseSectionId,
            {
                excludeEnrollmentId: Number(req.params.id)
            }
        );

        if (roleId === ROLE_STUDENT && enrollmentClassification.enrollment_type === "hoc_di") {
            return res.status(403).json({
                message: "Sinh vien chi duoc dang ky hoc lai hoac hoc cai thien. Hoc di do admin xep lich hoc cho lop."
            });
        }

        const result = await enrollmentsModel.update(req.params.id, {
            student_id: nextStudentId,
            course_section_id: nextCourseSectionId,
            status: nextStatus
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay dang ky hoc"
            });
        }

        return res.json({
            message: "Cap nhat dang ky hoc thanh cong",
            data: {
                id: Number(req.params.id),
                student_id: nextStudentId,
                course_section_id: nextCourseSectionId,
                status: nextStatus,
                is_retake: enrollmentClassification.is_retake,
                is_improvement: enrollmentClassification.is_improvement,
                enrollment_type: enrollmentClassification.enrollment_type,
                is_current_registration: ["cancelled", "canceled", "dropped", "completed"].includes(String(nextStatus).toLowerCase())
                    ? false
                    : true
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat dang ky hoc",
            error: error.message
        });
    }
};

exports.deleteEnrollment = async (req, res) => {
    try {
        const enrollment = await enrollmentsModel.getByIdForUser(req.params.id, req.user);

        if (!enrollment) {
            return res.status(404).json({
                message: "Khong tim thay dang ky hoc"
            });
        }

        const roleId = getRoleId(req.user);

        if (roleId !== ROLE_ADMIN && roleId !== ROLE_STUDENT) {
            return res.status(403).json({
                message: "Ban khong co quyen xoa dang ky hoc"
            });
        }

        const result = await enrollmentsModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay dang ky hoc"
            });
        }

        return res.json({
            message: "Xoa dang ky hoc thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa dang ky hoc",
            error: error.message
        });
    }
};
