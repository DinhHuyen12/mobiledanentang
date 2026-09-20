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

const buildGradeSelect = () => `
    SELECT
        g.id,
        g.enrollment_id,
        e.student_id,
        e.course_section_id,
        cs.lecturer_id,
        cs.subject_id,
        s.subject_code,
        s.name AS subject_name,
        s.credits,
        sem.id AS semester_id,
        sem.name AS semester_name,
        u.full_name AS student_name,
        g.attendance_score,
        g.midterm_score,
        g.final_score,
        g.total_score,
        g.letter_grade
    FROM grades g
    INNER JOIN enrollments e ON g.enrollment_id = e.id
    INNER JOIN student_info si ON e.student_id = si.id
    INNER JOIN users u ON si.user_id = u.id
    INNER JOIN course_sections cs ON e.course_section_id = cs.id
    INNER JOIN subjects s ON cs.subject_id = s.id
    LEFT JOIN semesters sem ON cs.semester_id = sem.id
`;

const buildAcademicSummary = (rows) => {
    const bestBySubject = new Map();

    for (const row of rows) {
        const existing = bestBySubject.get(Number(row.subject_id));

        if (!existing || Number(row.total_score) > Number(existing.total_score)) {
            bestBySubject.set(Number(row.subject_id), row);
        }
    }

    const bestAttempts = Array.from(bestBySubject.values());
    const attemptedCredits = bestAttempts.reduce((sum, row) => sum + Number(row.credits || 0), 0);
    const earnedCredits = bestAttempts
        .filter((row) => Number(row.total_score) >= PASSING_SCORE)
        .reduce((sum, row) => sum + Number(row.credits || 0), 0);
    const totalQualityPoints = bestAttempts.reduce((sum, row) => {
        const gradePoint = GRADE_POINTS[row.letter_grade] ?? 0;
        return sum + (Number(row.credits || 0) * gradePoint);
    }, 0);
    const cumulativeGpa = attemptedCredits > 0
        ? Math.round((totalQualityPoints / attemptedCredits) * 100) / 100
        : 0;

    let academicStanding = "binh_thuong";

    if (cumulativeGpa < 2) {
        academicStanding = "canh_bao_hoc_vu";
    } else if (cumulativeGpa >= 3.6) {
        academicStanding = "xuat_sac";
    } else if (cumulativeGpa >= 3.2) {
        academicStanding = "gioi";
    } else if (cumulativeGpa >= 2.5) {
        academicStanding = "kha";
    }

    return {
        total_subjects: bestAttempts.length,
        attempted_credits: attemptedCredits,
        earned_credits: earnedCredits,
        failed_subjects: bestAttempts.filter((row) => Number(row.total_score) < PASSING_SCORE).length,
        cumulative_gpa: cumulativeGpa,
        academic_standing: academicStanding
    };
};

const gradesModel = {
    getEnrollmentContextById: async (enrollmentId) => {
        const [rows] = await db.query(
            `SELECT
                e.id,
                e.student_id,
                e.course_section_id,
                e.status,
                cs.lecturer_id,
                cs.subject_id,
                cs.semester_id
             FROM enrollments e
             INNER JOIN course_sections cs ON e.course_section_id = cs.id
             WHERE e.id = ?
             LIMIT 1`,
            [enrollmentId]
        );

        return rows[0];
    },

    getByEnrollmentId: async (enrollmentId) => {
        const [rows] = await db.query(
            `SELECT id, enrollment_id
             FROM grades
             WHERE enrollment_id = ?
             LIMIT 1`,
            [enrollmentId]
        );

        return rows[0];
    },

    getStudentInfoByUserId: async (userId) => {
        const [rows] = await db.query(
            `SELECT id, user_id
             FROM student_info
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        return rows[0];
    },

    getStudentInfoById: async (studentId) => {
        const [rows] = await db.query(
            `SELECT id, user_id
             FROM student_info
             WHERE id = ?
             LIMIT 1`,
            [studentId]
        );

        return rows[0];
    },

    getLecturerInfoByUserId: async (userId) => {
        const [rows] = await db.query(
            `SELECT id, user_id
             FROM lecturer_info
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        return rows[0];
    },

    getAll: async () => {
        const [rows] = await db.query(`
            ${buildGradeSelect()}
            ORDER BY g.id ASC
        `);

        return rows;
    },

    getAllForUser: async (user) => {
        if (isAdminUser(user)) {
            return gradesModel.getAll();
        }

        if (isLecturerUser(user)) {
            const lecturerInfo = await gradesModel.getLecturerInfoByUserId(user.id);

            if (!lecturerInfo) {
                return [];
            }

            const [rows] = await db.query(
                `${buildGradeSelect()}
                 WHERE cs.lecturer_id = ?
                 ORDER BY g.id ASC`,
                [lecturerInfo.id]
            );

            return rows;
        }

        if (isStudentUser(user)) {
            const studentInfo = await gradesModel.getStudentInfoByUserId(user.id);

            if (!studentInfo) {
                return [];
            }

            const [rows] = await db.query(
                `${buildGradeSelect()}
                 WHERE e.student_id = ?
                 ORDER BY g.id ASC`,
                [studentInfo.id]
            );

            return rows;
        }

        return [];
    },

    getById: async (id) => {
        const [rows] = await db.query(
            `${buildGradeSelect()}
             WHERE g.id = ?`,
            [id]
        );

        return rows[0];
    },

    getByIdForUser: async (id, user) => {
        if (isAdminUser(user)) {
            return gradesModel.getById(id);
        }

        if (isLecturerUser(user)) {
            const lecturerInfo = await gradesModel.getLecturerInfoByUserId(user.id);

            if (!lecturerInfo) {
                return null;
            }

            const [rows] = await db.query(
                `${buildGradeSelect()}
                 WHERE g.id = ?
                   AND cs.lecturer_id = ?`,
                [id, lecturerInfo.id]
            );

            return rows[0];
        }

        if (isStudentUser(user)) {
            const studentInfo = await gradesModel.getStudentInfoByUserId(user.id);

            if (!studentInfo) {
                return null;
            }

            const [rows] = await db.query(
                `${buildGradeSelect()}
                 WHERE g.id = ?
                   AND e.student_id = ?`,
                [id, studentInfo.id]
            );

            return rows[0];
        }

        return null;
    },

    getTranscriptRowsForUser: async (user, studentId = null) => {
        if (isAdminUser(user)) {
            const targetStudentId = studentId ? Number(studentId) : null;
            const [rows] = await db.query(
                `${buildGradeSelect()}
                 ${targetStudentId ? "WHERE e.student_id = ?" : ""}
                 ORDER BY sem.id ASC, s.name ASC, g.id ASC`,
                targetStudentId ? [targetStudentId] : []
            );

            return rows;
        }

        if (isLecturerUser(user)) {
            const lecturerInfo = await gradesModel.getLecturerInfoByUserId(user.id);

            if (!lecturerInfo) {
                return [];
            }

            const params = [lecturerInfo.id];
            let query = `${buildGradeSelect()}
                 WHERE cs.lecturer_id = ?`;

            if (studentId) {
                query += " AND e.student_id = ?";
                params.push(Number(studentId));
            }

            query += " ORDER BY sem.id ASC, s.name ASC, g.id ASC";
            const [rows] = await db.query(query, params);
            return rows;
        }

        if (isStudentUser(user)) {
            const studentInfo = await gradesModel.getStudentInfoByUserId(user.id);

            if (!studentInfo) {
                return [];
            }

            const [rows] = await db.query(
                `${buildGradeSelect()}
                 WHERE e.student_id = ?
                 ORDER BY sem.id ASC, s.name ASC, g.id ASC`,
                [studentInfo.id]
            );

            return rows;
        }

        return [];
    },

    getAcademicSummaryForUser: async (user, studentId = null) => {
        const rows = await gradesModel.getTranscriptRowsForUser(user, studentId);
        return buildAcademicSummary(rows);
    },

    create: async (data) => {
        const {
            enrollment_id,
            attendance_score,
            midterm_score,
            final_score,
            total_score,
            letter_grade
        } = data;

        const [result] = await db.query(
            `INSERT INTO grades
             (enrollment_id, attendance_score, midterm_score, final_score, total_score, letter_grade)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [enrollment_id, attendance_score, midterm_score, final_score, total_score, letter_grade]
        );

        return result;
    },

    update: async (id, data) => {
        const {
            enrollment_id,
            attendance_score,
            midterm_score,
            final_score,
            total_score,
            letter_grade
        } = data;

        const [result] = await db.query(
            `UPDATE grades
             SET enrollment_id = ?, attendance_score = ?, midterm_score = ?, final_score = ?, total_score = ?, letter_grade = ?
             WHERE id = ?`,
            [enrollment_id, attendance_score, midterm_score, final_score, total_score, letter_grade, id]
        );

        return result;
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM grades WHERE id = ?",
            [id]
        );

        return result;
    }
};

module.exports = gradesModel;
