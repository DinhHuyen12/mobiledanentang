const db = require("../config/db");

const isAdminUser = (user) => Number(user?.role_id || user?.role) === 1;
const isLecturerUser = (user) => Number(user?.role_id || user?.role) === 2;
const isStudentUser = (user) => Number(user?.role_id || user?.role) === 3;

const STATUS_LABELS = {
    active: "Đang hoạt động",
    inactive: "Ngừng hoạt động",
    inferred: "Tự suy luận"
};

const SUBJECT_TYPE_LABELS = {
    required: "Bắt buộc",
    elective: "Tự chọn"
};

const localizeProgram = (program) => {
    if (!program) {
        return program;
    }

    const statusCode = program.status;

    return {
        ...program,
        status_code: statusCode,
        status: STATUS_LABELS[statusCode] || statusCode,
        status_label: STATUS_LABELS[statusCode] || statusCode
    };
};

const localizeCurriculumSubject = (subject) => {
    if (!subject) {
        return subject;
    }

    const subjectTypeCode = subject.subject_type;

    return {
        ...subject,
        subject_type_code: subjectTypeCode,
        subject_type: SUBJECT_TYPE_LABELS[subjectTypeCode] || subjectTypeCode,
        subject_type_label: SUBJECT_TYPE_LABELS[subjectTypeCode] || subjectTypeCode
    };
};

const buildProgramSelect = () => `
    SELECT
        tp.id,
        tp.faculty_id,
        f.name AS faculty_name,
        tp.code,
        tp.name,
        tp.total_credits_required,
        tp.elective_credits_required,
        tp.status,
        tp.description,
        tp.created_at,
        tp.updated_at
    FROM training_programs tp
    LEFT JOIN faculties f ON tp.faculty_id = f.id
`;

const curriculumSelect = `
    SELECT
        tps.id,
        tps.program_id,
        tps.subject_id,
        s.subject_code,
        s.name AS subject_name,
        s.credits,
        tps.subject_type,
        tps.recommended_semester,
        tps.display_order,
        tps.total_hours,
        tps.elearning,
        tps.include_in_gpa,
        tps.min_score_required
    FROM training_program_subjects tps
    INNER JOIN subjects s ON tps.subject_id = s.id
`;

const inferProgramByStudentId = async (studentId) => {
    const [rows] = await db.query(
        `SELECT
            tp.id,
            ? AS student_id,
            tp.id AS program_id,
            NULL AS start_date,
            NULL AS expected_graduation_date,
            'inferred' AS status,
            tp.code AS program_code,
            tp.name AS program_name,
            tp.total_credits_required,
            tp.elective_credits_required,
            tp.faculty_id,
            f.name AS faculty_name
         FROM student_info si
         INNER JOIN classes c ON si.class_id = c.id
         INNER JOIN training_programs tp ON tp.faculty_id = c.faculty_id
         LEFT JOIN faculties f ON tp.faculty_id = f.id
         WHERE si.id = ?
           AND tp.status = 'active'
         ORDER BY tp.id ASC
         LIMIT 1`,
        [studentId, studentId]
    );

    return localizeProgram(rows[0]) || null;
};

const trainingProgramsModel = {
    getAll: async () => {
        const [rows] = await db.query(`
            ${buildProgramSelect()}
            ORDER BY tp.id ASC
        `);

        return rows.map(localizeProgram);
    },

    getById: async (id) => {
        const [rows] = await db.query(
            `${buildProgramSelect()}
             WHERE tp.id = ?`,
            [id]
        );

        return localizeProgram(rows[0]);
    },

    getCurriculum: async (programId) => {
        const [rows] = await db.query(
            `${curriculumSelect}
             WHERE tps.program_id = ?
             ORDER BY
                tps.include_in_gpa DESC,
                tps.recommended_semester ASC,
                tps.display_order ASC,
                s.subject_code ASC,
                s.name ASC`,
            [programId]
        );

        return rows.map(localizeCurriculumSubject);
    },

    getStudentProgramByStudentId: async (studentId) => {
        const [rows] = await db.query(
            `SELECT
                sp.id,
                sp.student_id,
                sp.program_id,
                sp.start_date,
                sp.expected_graduation_date,
                sp.status,
                tp.code AS program_code,
                tp.name AS program_name,
                tp.total_credits_required,
                tp.elective_credits_required,
                tp.faculty_id,
                f.name AS faculty_name
             FROM student_programs sp
             INNER JOIN training_programs tp ON sp.program_id = tp.id
             LEFT JOIN faculties f ON tp.faculty_id = f.id
             WHERE sp.student_id = ?
             ORDER BY (sp.status = 'active') DESC, sp.start_date DESC, sp.id DESC
             LIMIT 1`,
            [studentId]
        );

        return localizeProgram(rows[0]) || inferProgramByStudentId(studentId);
    },

    getStudentProgramByUserId: async (userId) => {
        const [rows] = await db.query(
            `SELECT id
             FROM student_info
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        if (!rows[0]) {
            return null;
        }

        return trainingProgramsModel.getStudentProgramByStudentId(rows[0].id);
    },

    getMyProgramForUser: async (user) => {
        if (!isStudentUser(user)) {
            return null;
        }

        const [rows] = await db.query(
            `SELECT id
             FROM student_info
             WHERE user_id = ?
             LIMIT 1`,
            [user.id]
        );

        if (!rows[0]) {
            return null;
        }

        return trainingProgramsModel.getStudentProgramByStudentId(rows[0].id);
    },

    create: async (data) => {
        const {
            faculty_id,
            code,
            name,
            total_credits_required,
            elective_credits_required,
            status,
            description
        } = data;

        const [result] = await db.query(
            `INSERT INTO training_programs
             (faculty_id, code, name, total_credits_required, elective_credits_required, status, description)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                faculty_id,
                code,
                name,
                total_credits_required,
                elective_credits_required,
                status,
                description || null
            ]
        );

        return result;
    },

    update: async (id, data) => {
        const {
            faculty_id,
            code,
            name,
            total_credits_required,
            elective_credits_required,
            status,
            description
        } = data;

        const [result] = await db.query(
            `UPDATE training_programs
             SET faculty_id = ?, code = ?, name = ?, total_credits_required = ?, elective_credits_required = ?, status = ?, description = ?
             WHERE id = ?`,
            [
                faculty_id,
                code,
                name,
                total_credits_required,
                elective_credits_required,
                status,
                description || null,
                id
            ]
        );

        return result;
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM training_programs WHERE id = ?",
            [id]
        );

        return result;
    },

    assignStudentToProgram: async (data) => {
        const {
            student_id,
            program_id,
            start_date,
            expected_graduation_date,
            status
        } = data;

        const [result] = await db.query(
            `INSERT INTO student_programs
             (student_id, program_id, start_date, expected_graduation_date, status)
             VALUES (?, ?, ?, ?, ?)`,
            [
                student_id,
                program_id,
                start_date,
                expected_graduation_date || null,
                status
            ]
        );

        return result;
    },

    addCurriculumSubject: async (data) => {
        const [result] = await db.query(
            `INSERT INTO training_program_subjects
             (program_id, subject_id, subject_type, recommended_semester, display_order, total_hours, elearning, include_in_gpa, min_score_required)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.program_id,
                data.subject_id,
                data.subject_type,
                data.recommended_semester || null,
                data.display_order || 1,
                data.total_hours || 0,
                data.elearning || null,
                data.include_in_gpa === undefined ? 1 : Number(Boolean(data.include_in_gpa)),
                data.min_score_required
            ]
        );

        return result;
    },

    updateCurriculumSubject: async (id, data) => {
        const [result] = await db.query(
            `UPDATE training_program_subjects
             SET program_id = ?, subject_id = ?, subject_type = ?, recommended_semester = ?, display_order = ?, total_hours = ?, elearning = ?, include_in_gpa = ?, min_score_required = ?
             WHERE id = ?`,
            [
                data.program_id,
                data.subject_id,
                data.subject_type,
                data.recommended_semester || null,
                data.display_order || 1,
                data.total_hours || 0,
                data.elearning || null,
                data.include_in_gpa === undefined ? 1 : Number(Boolean(data.include_in_gpa)),
                data.min_score_required,
                id
            ]
        );

        return result;
    },

    removeCurriculumSubject: async (id) => {
        const [result] = await db.query(
            "DELETE FROM training_program_subjects WHERE id = ?",
            [id]
        );

        return result;
    },

    getProgramDetailForUser: async (id, user) => {
        const program = await trainingProgramsModel.getById(id);

        if (!program) {
            return null;
        }

        if (isAdminUser(user) || isLecturerUser(user)) {
            return program;
        }

        const currentProgram = await trainingProgramsModel.getMyProgramForUser(user);

        if (!currentProgram || Number(currentProgram.program_id) !== Number(id)) {
            return null;
        }

        return program;
    }
};

module.exports = trainingProgramsModel;
