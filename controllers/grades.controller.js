const gradesModel = require("../models/grades.model");
const { buildWorkbookBuffer } = require("../utils/excel");
const { createAppError } = require("../utils/validation");

const roundScore = (score) => Math.round(score * 10) / 10;
const getRoleId = (user) => Number(user?.role_id || user?.role);
const PASSING_SCORE = 5;

const resolveLetterGrade = (totalScore) => {
    if (totalScore >= 8.5) {
        return "A";
    }

    if (totalScore >= 8.0) {
        return "B+";
    }

    if (totalScore >= 7.0) {
        return "B";
    }

    if (totalScore >= 6.5) {
        return "C+";
    }

    if (totalScore >= 5.5) {
        return "C";
    }

    if (totalScore >= 5.0) {
        return "D+";
    }

    if (totalScore >= 4.0) {
        return "D";
    }

    return "F";
};

const normalizeAndCalculateGrade = (attendanceScore, midtermScore, finalScore) => {
    const normalizedAttendance = Number(attendanceScore);
    const normalizedMidterm = Number(midtermScore);
    const normalizedFinal = Number(finalScore);

    if (
        !Number.isFinite(normalizedAttendance) ||
        !Number.isFinite(normalizedMidterm) ||
        !Number.isFinite(normalizedFinal)
    ) {
        return {
            ok: false,
            code: 400,
            message: "Diem chuyen can, diem giua ky va diem cuoi ky phai la so"
        };
    }

    if (
        normalizedAttendance < 0 ||
        normalizedAttendance > 10 ||
        normalizedMidterm < 0 ||
        normalizedMidterm > 10 ||
        normalizedFinal < 0 ||
        normalizedFinal > 10
    ) {
        return {
            ok: false,
            code: 400,
            message: "Diem chuyen can, diem giua ky va diem cuoi ky phai nam trong khoang 0 den 10"
        };
    }

    const totalScore = roundScore((((normalizedAttendance + normalizedMidterm) / 2) + normalizedFinal) / 2);

    return {
        ok: true,
        attendance_score: normalizedAttendance,
        midterm_score: normalizedMidterm,
        final_score: normalizedFinal,
        total_score: totalScore,
        letter_grade: resolveLetterGrade(totalScore)
    };
};

const validateGradeOperation = async (user, enrollmentId, gradeIdToExclude = null) => {
    const enrollment = await gradesModel.getEnrollmentContextById(Number(enrollmentId));

    if (!enrollment) {
        throw createAppError(404, "Khong tim thay dang ky hoc");
    }

    const normalizedEnrollmentStatus = String(enrollment.status || "").toLowerCase();
    if (["pending", "cancelled", "canceled", "dropped", "rejected"].includes(normalizedEnrollmentStatus)) {
        throw createAppError(409, "Chi co the nhap diem cho dang ky hoc da duoc duyet");
    }

    const roleId = getRoleId(user);
    if (roleId === 2) {
        const lecturerInfo = await gradesModel.getLecturerInfoByUserId(user.id);

        if (!lecturerInfo || Number(lecturerInfo.id) !== Number(enrollment.lecturer_id)) {
            throw createAppError(403, "Giang vien khong co quyen cap nhat diem cho hoc phan nay");
        }
    }

    const existingGrade = await gradesModel.getByEnrollmentId(Number(enrollmentId));
    if (existingGrade && Number(existingGrade.id) !== Number(gradeIdToExclude)) {
        throw createAppError(409, "Dang ky hoc nay da co diem");
    }
};

const resolveStudentIdFilter = (req, res) => {
    const roleId = getRoleId(req.user);
    const studentId = req.query.student_id || null;

    if ((roleId === 1 || roleId === 2) && !studentId) {
        res.status(400).json({
            message: "Admin hoac giang vien phai truyen student_id"
        });
        return null;
    }

    return studentId;
};

exports.getAllGrades = async (req, res) => {
    try {
        const data = await gradesModel.getAllForUser(req.user);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach diem",
            error: error.message
        });
    }
};

exports.getGradeById = async (req, res) => {
    try {
        const data = await gradesModel.getByIdForUser(req.params.id, req.user);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay diem"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay diem",
            error: error.message
        });
    }
};

exports.getTranscript = async (req, res) => {
    try {
        const studentId = resolveStudentIdFilter(req, res);

        if (studentId === null && res.headersSent) {
            return;
        }

        const transcript = await gradesModel.getTranscriptRowsForUser(req.user, studentId);
        const summary = await gradesModel.getAcademicSummaryForUser(req.user, studentId);

        return res.json({
            summary,
            transcript
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay bang diem tong hop",
            error: error.message
        });
    }
};

exports.getAcademicSummary = async (req, res) => {
    try {
        const studentId = resolveStudentIdFilter(req, res);

        if (studentId === null && res.headersSent) {
            return;
        }

        const data = await gradesModel.getAcademicSummaryForUser(req.user, studentId);

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay tong ket hoc tap",
            error: error.message
        });
    }
};

exports.getAcademicProgress = async (req, res) => {
    try {
        const studentId = resolveStudentIdFilter(req, res);

        if (studentId === null && res.headersSent) {
            return;
        }

        const transcript = await gradesModel.getTranscriptRowsForUser(req.user, studentId);
        const summary = await gradesModel.getAcademicSummaryForUser(req.user, studentId);
        const passedSubjects = new Set(
            transcript
                .filter((row) => Number(row.total_score) >= PASSING_SCORE)
                .map((row) => Number(row.subject_id))
        );

        return res.json({
            ...summary,
            passed_subjects: passedSubjects.size,
            total_attempts: transcript.length
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay tien do hoc tap",
            error: error.message
        });
    }
};

exports.exportTranscript = async (req, res) => {
    try {
        const studentId = resolveStudentIdFilter(req, res);

        if (studentId === null && res.headersSent) {
            return;
        }

        const transcript = await gradesModel.getTranscriptRowsForUser(req.user, studentId);
        const summary = await gradesModel.getAcademicSummaryForUser(req.user, studentId);

        const transcriptRows = transcript.map((row, index) => ({
            STT: index + 1,
            Sinh_vien: row.student_name,
            Ma_mon: row.subject_code,
            Mon_hoc: row.subject_name,
            Hoc_ky: row.semester_name,
            So_tin_chi: row.credits,
            Diem_chuyen_can: row.attendance_score,
            Diem_giua_ky: row.midterm_score,
            Diem_cuoi_ky: row.final_score,
            Tong_ket: row.total_score,
            Diem_chu: row.letter_grade
        }));

        const summaryRows = [
            { Chi_so: "Tong so mon", Gia_tri: summary.total_subjects },
            { Chi_so: "So tin chi da tich luy", Gia_tri: summary.earned_credits },
            { Chi_so: "So tin chi da hoc", Gia_tri: summary.attempted_credits },
            { Chi_so: "So mon rot", Gia_tri: summary.failed_subjects },
            { Chi_so: "GPA tich luy", Gia_tri: summary.cumulative_gpa },
            { Chi_so: "Xep loai hoc tap", Gia_tri: summary.academic_standing }
        ];

        const workbookBuffer = buildWorkbookBuffer([
            { name: "Bang_diem", rows: transcriptRows },
            { name: "Tong_hop", rows: summaryRows }
        ]);
        const fileName = `bang-diem-${studentId || req.user.id}.xlsx`;

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        return res.send(workbookBuffer);
    } catch (error) {
        return res.status(500).json({
            message: "Loi export bang diem",
            error: error.message
        });
    }
};

exports.calculateGrade = async (req, res) => {
    try {
        const { attendance_score, midterm_score, final_score } = req.body;

        if (attendance_score === undefined || midterm_score === undefined || final_score === undefined) {
            return res.status(400).json({
                message: "Thieu attendance_score, midterm_score hoac final_score"
            });
        }

        const calculatedGrade = normalizeAndCalculateGrade(attendance_score, midterm_score, final_score);

        if (!calculatedGrade.ok) {
            return res.status(calculatedGrade.code).json({
                message: calculatedGrade.message
            });
        }

        return res.json({
            message: "Tinh diem thanh cong",
            data: {
                attendance_score: calculatedGrade.attendance_score,
                midterm_score: calculatedGrade.midterm_score,
                final_score: calculatedGrade.final_score,
                total_score: calculatedGrade.total_score,
                letter_grade: calculatedGrade.letter_grade
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tinh diem",
            error: error.message
        });
    }
};

exports.createGrade = async (req, res) => {
    try {
        const {
            enrollment_id,
            attendance_score,
            midterm_score,
            final_score
        } = req.body;

        if (!enrollment_id || attendance_score === undefined || midterm_score === undefined || final_score === undefined) {
            return res.status(400).json({
                message: "Thieu enrollment_id, attendance_score, midterm_score hoac final_score"
            });
        }

        const calculatedGrade = normalizeAndCalculateGrade(attendance_score, midterm_score, final_score);

        if (!calculatedGrade.ok) {
            return res.status(calculatedGrade.code).json({
                message: calculatedGrade.message
            });
        }

        await validateGradeOperation(req.user, enrollment_id);

        const result = await gradesModel.create({
            enrollment_id,
            attendance_score: calculatedGrade.attendance_score,
            midterm_score: calculatedGrade.midterm_score,
            final_score: calculatedGrade.final_score,
            total_score: calculatedGrade.total_score,
            letter_grade: calculatedGrade.letter_grade
        });

        return res.status(201).json({
            message: "Tao diem thanh cong",
            id: result.insertId,
            data: {
                enrollment_id: Number(enrollment_id),
                attendance_score: calculatedGrade.attendance_score,
                midterm_score: calculatedGrade.midterm_score,
                final_score: calculatedGrade.final_score,
                total_score: calculatedGrade.total_score,
                letter_grade: calculatedGrade.letter_grade
            }
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "Loi tao diem",
            error: error.statusCode ? undefined : error.message
        });
    }
};

exports.updateGrade = async (req, res) => {
    try {
        const {
            enrollment_id,
            attendance_score,
            midterm_score,
            final_score
        } = req.body;

        if (!enrollment_id || attendance_score === undefined || midterm_score === undefined || final_score === undefined) {
            return res.status(400).json({
                message: "Thieu enrollment_id, attendance_score, midterm_score hoac final_score"
            });
        }

        const calculatedGrade = normalizeAndCalculateGrade(attendance_score, midterm_score, final_score);

        if (!calculatedGrade.ok) {
            return res.status(calculatedGrade.code).json({
                message: calculatedGrade.message
            });
        }

        await validateGradeOperation(req.user, enrollment_id, req.params.id);

        const result = await gradesModel.update(req.params.id, {
            enrollment_id,
            attendance_score: calculatedGrade.attendance_score,
            midterm_score: calculatedGrade.midterm_score,
            final_score: calculatedGrade.final_score,
            total_score: calculatedGrade.total_score,
            letter_grade: calculatedGrade.letter_grade
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay diem"
            });
        }

        return res.json({
            message: "Cap nhat diem thanh cong",
            data: {
                enrollment_id: Number(enrollment_id),
                attendance_score: calculatedGrade.attendance_score,
                midterm_score: calculatedGrade.midterm_score,
                final_score: calculatedGrade.final_score,
                total_score: calculatedGrade.total_score,
                letter_grade: calculatedGrade.letter_grade
            }
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "Loi cap nhat diem",
            error: error.statusCode ? undefined : error.message
        });
    }
};

exports.deleteGrade = async (req, res) => {
    try {
        const result = await gradesModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay diem"
            });
        }

        return res.json({
            message: "Xoa diem thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa diem",
            error: error.message
        });
    }
};
