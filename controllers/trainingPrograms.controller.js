const trainingProgramsModel = require("../models/trainingPrograms.model");

const normalizeStatus = (status) => {
    const value = String(status || "").trim().toLowerCase();
    const aliases = {
        "đang hoạt động": "active",
        "dang hoat dong": "active",
        active: "active",
        "ngừng hoạt động": "inactive",
        "ngung hoat dong": "inactive",
        inactive: "inactive"
    };

    return aliases[value] || status;
};

const normalizeSubjectType = (subjectType) => {
    const value = String(subjectType || "").trim().toLowerCase();
    const aliases = {
        "bắt buộc": "required",
        "bat buoc": "required",
        required: "required",
        "tự chọn": "elective",
        "tu chon": "elective",
        elective: "elective"
    };

    return aliases[value] || subjectType;
};

const splitCurriculum = (curriculum) => {
    const curriculum_by_semester = curriculum
        .filter((item) => Number(item.include_in_gpa) === 1)
        .reduce((acc, item) => {
            const semester = Number(item.recommended_semester || 0);

            if (!acc[semester]) {
                acc[semester] = [];
            }

                acc[semester].push({
                    ...item,
                is_elective: (item.subject_type_code || item.subject_type) === "elective"
            });
            return acc;
        }, {});

    return {
        curriculum_by_semester,
        non_gpa_subjects: curriculum.filter((item) => Number(item.include_in_gpa) === 0)
    };
};

exports.getAllTrainingPrograms = async (req, res) => {
    try {
        const data = await trainingProgramsModel.getAll();
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach chuong trinh dao tao",
            error: error.message
        });
    }
};

exports.getTrainingProgramById = async (req, res) => {
    try {
        const program = await trainingProgramsModel.getProgramDetailForUser(req.params.id, req.user);

        if (!program) {
            return res.status(404).json({
                message: "Khong tim thay chuong trinh dao tao"
            });
        }

        const curriculum = await trainingProgramsModel.getCurriculum(req.params.id);
        const extraCurriculum = splitCurriculum(curriculum);

        return res.json({
            ...program,
            curriculum,
            ...extraCurriculum
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay chuong trinh dao tao",
            error: error.message
        });
    }
};

exports.getMyTrainingProgram = async (req, res) => {
    try {
        const myProgram = await trainingProgramsModel.getMyProgramForUser(req.user);

        if (!myProgram) {
            return res.status(404).json({
                message: "Khong tim thay chuong trinh dao tao cua sinh vien"
            });
        }

        const program = await trainingProgramsModel.getById(myProgram.program_id);
        const curriculum = await trainingProgramsModel.getCurriculum(myProgram.program_id);
        const extraCurriculum = splitCurriculum(curriculum);

        return res.json({
            assignment: myProgram,
            program,
            curriculum,
            ...extraCurriculum
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay chuong trinh dao tao cua toi",
            error: error.message
        });
    }
};

exports.assignStudentToProgram = async (req, res) => {
    try {
        const {
            student_id,
            program_id,
            start_date,
            expected_graduation_date,
            status
        } = req.body;

        if (!student_id || !program_id || !start_date || !status) {
            return res.status(400).json({
                message: "Thieu student_id, program_id, start_date hoac status"
            });
        }

        const result = await trainingProgramsModel.assignStudentToProgram({
            student_id,
            program_id,
            start_date,
            expected_graduation_date,
            status: normalizeStatus(status)
        });

        return res.status(201).json({
            message: "Gan sinh vien vao chuong trinh dao tao thanh cong",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi gan sinh vien vao chuong trinh dao tao",
            error: error.message
        });
    }
};

exports.addCurriculumSubject = async (req, res) => {
    try {
        const {
            program_id,
            subject_id,
            subject_type,
            recommended_semester,
            display_order,
            total_hours,
            elearning,
            include_in_gpa,
            min_score_required
        } = req.body;

        if (!program_id || !subject_id || !subject_type || min_score_required === undefined) {
            return res.status(400).json({
                message: "Thieu program_id, subject_id, subject_type hoac min_score_required"
            });
        }

        const result = await trainingProgramsModel.addCurriculumSubject({
            program_id,
            subject_id,
            subject_type: normalizeSubjectType(subject_type),
            recommended_semester,
            display_order,
            total_hours,
            elearning,
            include_in_gpa,
            min_score_required
        });

        return res.status(201).json({
            message: "Them mon vao chuong trinh dao tao thanh cong",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi them mon vao chuong trinh dao tao",
            error: error.message
        });
    }
};

exports.updateCurriculumSubject = async (req, res) => {
    try {
        const {
            program_id,
            subject_id,
            subject_type,
            recommended_semester,
            display_order,
            total_hours,
            elearning,
            include_in_gpa,
            min_score_required
        } = req.body;

        if (!program_id || !subject_id || !subject_type || min_score_required === undefined) {
            return res.status(400).json({
                message: "Thieu program_id, subject_id, subject_type hoac min_score_required"
            });
        }

        const result = await trainingProgramsModel.updateCurriculumSubject(req.params.id, {
            program_id,
            subject_id,
            subject_type,
            recommended_semester,
            display_order,
            total_hours,
            elearning,
            include_in_gpa,
            min_score_required
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay mon hoc trong chuong trinh dao tao"
            });
        }

        return res.json({
            message: "Cap nhat mon hoc trong chuong trinh dao tao thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat mon hoc trong chuong trinh dao tao",
            error: error.message
        });
    }
};

exports.deleteCurriculumSubject = async (req, res) => {
    try {
        const result = await trainingProgramsModel.removeCurriculumSubject(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay mon hoc trong chuong trinh dao tao"
            });
        }

        return res.json({
            message: "Xoa mon hoc khoi chuong trinh dao tao thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa mon hoc khoi chuong trinh dao tao",
            error: error.message
        });
    }
};

exports.createTrainingProgram = async (req, res) => {
    try {
        const {
            faculty_id,
            code,
            name,
            total_credits_required,
            elective_credits_required,
            status,
            description
        } = req.body;

        if (
            !faculty_id ||
            !code ||
            !name ||
            total_credits_required === undefined ||
            elective_credits_required === undefined ||
            !status
        ) {
            return res.status(400).json({
                message: "Thieu faculty_id, code, name, total_credits_required, elective_credits_required hoac status"
            });
        }

        const result = await trainingProgramsModel.create({
            faculty_id,
            code,
            name,
            total_credits_required,
            elective_credits_required,
            status: normalizeStatus(status),
            description
        });

        return res.status(201).json({
            message: "Tao chuong trinh dao tao thanh cong",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao chuong trinh dao tao",
            error: error.message
        });
    }
};

exports.updateTrainingProgram = async (req, res) => {
    try {
        const {
            faculty_id,
            code,
            name,
            total_credits_required,
            elective_credits_required,
            status,
            description
        } = req.body;

        if (
            !faculty_id ||
            !code ||
            !name ||
            total_credits_required === undefined ||
            elective_credits_required === undefined ||
            !status
        ) {
            return res.status(400).json({
                message: "Thieu faculty_id, code, name, total_credits_required, elective_credits_required hoac status"
            });
        }

        const result = await trainingProgramsModel.update(req.params.id, {
            faculty_id,
            code,
            name,
            total_credits_required,
            elective_credits_required,
            status: normalizeStatus(status),
            description
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay chuong trinh dao tao"
            });
        }

        return res.json({
            message: "Cap nhat chuong trinh dao tao thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat chuong trinh dao tao",
            error: error.message
        });
    }
};

exports.deleteTrainingProgram = async (req, res) => {
    try {
        const result = await trainingProgramsModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay chuong trinh dao tao"
            });
        }

        return res.json({
            message: "Xoa chuong trinh dao tao thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa chuong trinh dao tao",
            error: error.message
        });
    }
};
