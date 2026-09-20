const db = require("../config/db");

const isAdminUser = (user) => Number(user?.role_id || user?.role) === 1;
const isLecturerUser = (user) => Number(user?.role_id || user?.role) === 2;
const isStudentUser = (user) => Number(user?.role_id || user?.role) === 3;

const GRADE_POINTS = {
    A: 4.0,
    "B+": 3.5,
    B: 3.0,
    "C+": 2.5,
    C: 2.0,
    "D+": 1.5,
    D: 1.0,
    F: 0
};
const PASSING_SCORE = 5;

const getStudentIdByUserId = async (userId) => {
    const [rows] = await db.query(
        `SELECT id
         FROM student_info
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0]?.id || null;
};

const getLecturerIdByUserId = async (userId) => {
    const [rows] = await db.query(
        `SELECT id
         FROM lecturer_info
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0]?.id || null;
};

const inferStudentProgram = async (studentId) => {
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
            tp.elective_credits_required
         FROM student_info si
         INNER JOIN classes c ON si.class_id = c.id
         INNER JOIN training_programs tp ON tp.faculty_id = c.faculty_id
         WHERE si.id = ?
           AND tp.status = 'active'
         ORDER BY tp.id ASC
         LIMIT 1`,
        [studentId, studentId]
    );

    return rows[0] || null;
};

const graduationRequirementsModel = {
    getAll: async () => {
        const [rows] = await db.query(
            `SELECT
                gr.id,
                gr.program_id,
                tp.code AS program_code,
                tp.name AS program_name,
                gr.min_cumulative_gpa,
                gr.min_earned_credits,
                gr.max_failed_subjects,
                gr.required_english_level,
                gr.required_it_level,
                gr.status
             FROM graduation_requirements gr
             INNER JOIN training_programs tp ON gr.program_id = tp.id
             ORDER BY gr.id ASC`
        );

        return rows;
    },

    getByProgramId: async (programId) => {
        const [rows] = await db.query(
            `SELECT
                gr.id,
                gr.program_id,
                tp.code AS program_code,
                tp.name AS program_name,
                tp.total_credits_required,
                tp.elective_credits_required,
                gr.min_cumulative_gpa,
                gr.min_earned_credits,
                gr.max_failed_subjects,
                gr.required_english_level,
                gr.required_it_level,
                gr.status
             FROM graduation_requirements gr
             INNER JOIN training_programs tp ON gr.program_id = tp.id
             WHERE gr.program_id = ?
             LIMIT 1`,
            [programId]
        );

        return rows[0];
    },

    create: async (data) => {
        const {
            program_id,
            min_cumulative_gpa,
            min_earned_credits,
            max_failed_subjects,
            required_english_level,
            required_it_level,
            status
        } = data;

        const [result] = await db.query(
            `INSERT INTO graduation_requirements
             (program_id, min_cumulative_gpa, min_earned_credits, max_failed_subjects, required_english_level, required_it_level, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                program_id,
                min_cumulative_gpa,
                min_earned_credits,
                max_failed_subjects,
                required_english_level || null,
                required_it_level || null,
                status
            ]
        );

        return result;
    },

    update: async (id, data) => {
        const {
            program_id,
            min_cumulative_gpa,
            min_earned_credits,
            max_failed_subjects,
            required_english_level,
            required_it_level,
            status
        } = data;

        const [result] = await db.query(
            `UPDATE graduation_requirements
             SET program_id = ?, min_cumulative_gpa = ?, min_earned_credits = ?, max_failed_subjects = ?, required_english_level = ?, required_it_level = ?, status = ?
             WHERE id = ?`,
            [
                program_id,
                min_cumulative_gpa,
                min_earned_credits,
                max_failed_subjects,
                required_english_level || null,
                required_it_level || null,
                status,
                id
            ]
        );

        return result;
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM graduation_requirements WHERE id = ?",
            [id]
        );

        return result;
    },

    evaluateForStudentId: async (studentId) => {
        const [studentProgramRows] = await db.query(
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
                tp.elective_credits_required
             FROM student_programs sp
             INNER JOIN training_programs tp ON sp.program_id = tp.id
             WHERE sp.student_id = ?
             ORDER BY (sp.status = 'active') DESC, sp.start_date DESC, sp.id DESC
             LIMIT 1`,
            [studentId]
        );

        const studentProgram = studentProgramRows[0] || await inferStudentProgram(studentId);

        if (!studentProgram) {
            return null;
        }

        const requirements = await graduationRequirementsModel.getByProgramId(studentProgram.program_id);
        const [curriculumRows] = await db.query(
            `SELECT
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
             WHERE tps.program_id = ?
             ORDER BY
                tps.include_in_gpa DESC,
                tps.recommended_semester ASC,
                tps.display_order ASC,
                s.subject_code ASC,
                s.name ASC`,
            [studentProgram.program_id]
        );

        const [gradeRows] = await db.query(
            `SELECT
                s.id AS subject_id,
                s.subject_code,
                s.name AS subject_name,
                s.credits,
                g.total_score,
                g.letter_grade,
                g.id AS grade_id
             FROM grades g
             INNER JOIN enrollments e ON g.enrollment_id = e.id
             INNER JOIN course_sections cs ON e.course_section_id = cs.id
             INNER JOIN subjects s ON cs.subject_id = s.id
             INNER JOIN training_program_subjects tps
                 ON tps.program_id = ? AND tps.subject_id = s.id
             WHERE e.student_id = ?
             ORDER BY s.id ASC, g.total_score DESC, g.id DESC`,
            [studentProgram.program_id, studentId]
        );

        const bestBySubject = new Map();

        for (const row of gradeRows) {
            const key = Number(row.subject_id);
            const existing = bestBySubject.get(key);

            if (!existing || Number(row.total_score) > Number(existing.total_score)) {
                bestBySubject.set(key, row);
            }
        }

        const curriculumWithResult = curriculumRows.map((subject) => {
            const bestAttempt = bestBySubject.get(Number(subject.subject_id)) || null;
            const minScoreRequired = Number(subject.min_score_required || PASSING_SCORE);
            const passed = bestAttempt ? Number(bestAttempt.total_score) >= minScoreRequired : false;

            return {
                ...subject,
                best_total_score: bestAttempt ? Number(bestAttempt.total_score) : null,
                best_letter_grade: bestAttempt ? bestAttempt.letter_grade : null,
                passed
            };
        });

        const attemptedSubjects = curriculumWithResult.filter(
            (item) => Number(item.include_in_gpa) === 1 && item.best_total_score !== null
        );
        const earnedCredits = curriculumWithResult
            .filter((item) => item.passed)
            .reduce((sum, item) => sum + Number(item.credits || 0), 0);
        const electiveEarnedCredits = curriculumWithResult
            .filter((item) => item.passed && item.subject_type === "elective")
            .reduce((sum, item) => sum + Number(item.credits || 0), 0);
        const failedSubjects = curriculumWithResult.filter((item) => item.best_total_score !== null && !item.passed);
        const totalQualityPoints = attemptedSubjects.reduce((sum, item) => {
            const gradePoint = GRADE_POINTS[item.best_letter_grade] ?? 0;
            return sum + (Number(item.credits || 0) * gradePoint);
        }, 0);
        const attemptedCredits = attemptedSubjects.reduce((sum, item) => sum + Number(item.credits || 0), 0);
        const cumulativeGpa = attemptedCredits > 0
            ? Math.round((totalQualityPoints / attemptedCredits) * 100) / 100
            : 0;

        const missingRequiredSubjects = curriculumWithResult.filter(
            (item) => item.subject_type === "required" && !item.passed
        );

        const minEarnedCredits = Number(
            requirements?.min_earned_credits ?? studentProgram.total_credits_required ?? 0
        );
        const minCumulativeGpa = Number(requirements?.min_cumulative_gpa ?? 2);
        const maxFailedSubjects = Number(requirements?.max_failed_subjects ?? 0);
        const requiredElectiveCredits = Number(studentProgram.elective_credits_required || 0);

        const eligibilityChecks = {
            gpa_ok: cumulativeGpa >= minCumulativeGpa,
            earned_credits_ok: earnedCredits >= minEarnedCredits,
            elective_credits_ok: electiveEarnedCredits >= requiredElectiveCredits,
            failed_subjects_ok: failedSubjects.length <= maxFailedSubjects,
            required_subjects_ok: missingRequiredSubjects.length === 0
        };

        return {
            student_program: studentProgram,
            graduation_requirements: requirements,
            summary: {
                attempted_subjects: attemptedSubjects.length,
                attempted_credits: attemptedCredits,
                earned_credits: earnedCredits,
                elective_earned_credits: electiveEarnedCredits,
                cumulative_gpa: cumulativeGpa,
                failed_subjects: failedSubjects.length,
                missing_required_subjects: missingRequiredSubjects.length
            },
            eligibility_checks: eligibilityChecks,
            is_eligible_for_graduation: Object.values(eligibilityChecks).every(Boolean),
            missing_required_subject_list: missingRequiredSubjects.map((item) => ({
                subject_id: item.subject_id,
                subject_code: item.subject_code,
                subject_name: item.subject_name
            })),
            curriculum: curriculumWithResult
        };
    },

    evaluateForUser: async (user, studentId = null) => {
        if (isAdminUser(user)) {
            return studentId ? graduationRequirementsModel.evaluateForStudentId(Number(studentId)) : null;
        }

        if (isLecturerUser(user)) {
            if (!studentId) {
                return null;
            }

            const lecturerId = await getLecturerIdByUserId(user.id);

            if (!lecturerId) {
                return null;
            }

            const [rows] = await db.query(
                `SELECT si.id
                 FROM student_info si
                 WHERE si.id = ?
                   AND EXISTS (
                       SELECT 1
                       FROM enrollments e
                       INNER JOIN course_sections cs ON e.course_section_id = cs.id
                       WHERE e.student_id = si.id
                         AND cs.lecturer_id = ?
                   )
                 LIMIT 1`,
                [Number(studentId), lecturerId]
            );

            if (!rows[0]) {
                return null;
            }

            return graduationRequirementsModel.evaluateForStudentId(Number(studentId));
        }

        if (isStudentUser(user)) {
            const resolvedStudentId = await getStudentIdByUserId(user.id);

            if (!resolvedStudentId) {
                return null;
            }

            return graduationRequirementsModel.evaluateForStudentId(resolvedStudentId);
        }

        return null;
    }
};

module.exports = graduationRequirementsModel;
