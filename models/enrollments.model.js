const db = require("../config/db");

const NON_BLOCKING_REGISTRATION_STATUSES = ["cancelled", "canceled", "dropped", "completed", "rejected"];
const NON_PARTICIPATING_ENROLLMENT_STATUSES = ["pending", ...NON_BLOCKING_REGISTRATION_STATUSES];
const RETAKE_SCORE_THRESHOLD = 5;
const IMPROVEMENT_SCORE_UPPER_BOUND = 8;

const isAdminUser = (user) => Number(user?.role_id || user?.role) === 1;
const isLecturerUser = (user) => Number(user?.role_id || user?.role) === 2;
const isStudentUser = (user) => Number(user?.role_id || user?.role) === 3;

const buildNonBlockingRegistrationStatusPlaceholders = () =>
    NON_BLOCKING_REGISTRATION_STATUSES.map(() => "?").join(", ");

const buildNonParticipatingStatusPlaceholders = () =>
    NON_PARTICIPATING_ENROLLMENT_STATUSES.map(() => "?").join(", ");

const buildEnrollmentTypePayload = ({ isRetake, isImprovement }) => ({
    is_retake: isRetake,
    is_improvement: isImprovement,
    enrollment_type: isRetake ? "hoc_lai" : isImprovement ? "hoc_cai_thien" : "hoc_di"
});

const normalizeEnrollmentStatus = (status) => String(status || "").toLowerCase();
const isCurrentRegistrationStatus = (status) =>
    !NON_BLOCKING_REGISTRATION_STATUSES.includes(normalizeEnrollmentStatus(status));

const enrollmentsModel = {
    getStudentInfoByUserId: async (userId) => {
        const [rows] = await db.query(
            `SELECT id, user_id, class_id, enrollment_date, status
             FROM student_info
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        return rows[0];
    },

    getStudentInfoById: async (studentId) => {
        const [rows] = await db.query(
            `SELECT id, user_id, class_id, enrollment_date, status
             FROM student_info
             WHERE id = ?
             LIMIT 1`,
            [studentId]
        );

        return rows[0];
    },

    getActiveStudentsByClassId: async (classId) => {
        const [rows] = await db.query(
            `SELECT id, user_id, class_id, enrollment_date, status
             FROM student_info
             WHERE class_id = ?
               AND LOWER(COALESCE(status, 'active')) = 'active'
             ORDER BY id ASC`,
            [classId]
        );

        return rows;
    },

    getStudentAcademicContextById: async (studentId) => {
        const [rows] = await db.query(
            `SELECT
                si.id,
                si.user_id,
                si.class_id,
                si.status,
                c.faculty_id AS class_faculty_id
             FROM student_info si
             INNER JOIN classes c ON si.class_id = c.id
             WHERE si.id = ?
             LIMIT 1`,
            [studentId]
        );

        return rows[0];
    },

    getLecturerInfoByUserId: async (userId) => {
        const [rows] = await db.query(
            `SELECT id, user_id, lecturer_code, academic_rank, specialization
             FROM lecturer_info
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        return rows[0];
    },

    getAllForUser: async (user) => {
        const baseQuery = `
            SELECT
                e.id,
                e.student_id,
                si.user_id,
                u.full_name AS student_name,
                cs.id AS course_section_id,
                cs.lecturer_id,
                s.id AS subject_id,
                s.name AS subject_name,
                sem.id AS semester_id,
                sem.name AS semester_name,
                e.status
            FROM enrollments e
            LEFT JOIN student_info si ON e.student_id = si.id
            LEFT JOIN users u ON si.user_id = u.id
            LEFT JOIN course_sections cs ON e.course_section_id = cs.id
            LEFT JOIN subjects s ON cs.subject_id = s.id
            LEFT JOIN semesters sem ON cs.semester_id = sem.id
        `;

        if (isAdminUser(user)) {
            const [rows] = await db.query(`${baseQuery} ORDER BY e.id ASC`);
            return Promise.all(rows.map((row) => enrollmentsModel.decorateEnrollmentWithRetakeInfo(row)));
        }

        if (isLecturerUser(user)) {
            const lecturerInfo = await enrollmentsModel.getLecturerInfoByUserId(user.id);

            if (!lecturerInfo) {
                return [];
            }

            const [rows] = await db.query(
                `${baseQuery}
                 WHERE cs.lecturer_id = ?
                 ORDER BY e.id ASC`,
                [lecturerInfo.id]
            );

            return Promise.all(rows.map((row) => enrollmentsModel.decorateEnrollmentWithRetakeInfo(row)));
        }

        if (isStudentUser(user)) {
            const studentInfo = await enrollmentsModel.getStudentInfoByUserId(user.id);

            if (!studentInfo) {
                return [];
            }

            const [rows] = await db.query(
                `${baseQuery}
                 WHERE e.student_id = ?
                 ORDER BY e.id ASC`,
                [studentInfo.id]
            );

            return Promise.all(rows.map((row) => enrollmentsModel.decorateEnrollmentWithRetakeInfo(row)));
        }

        return [];
    },

    getByIdForUser: async (id, user) => {
        const baseQuery = `
            SELECT
                e.id,
                e.student_id,
                si.user_id,
                u.full_name AS student_name,
                e.course_section_id,
                cs.lecturer_id,
                cs.subject_id,
                cs.semester_id,
                e.status
            FROM enrollments e
            LEFT JOIN student_info si ON e.student_id = si.id
            LEFT JOIN users u ON si.user_id = u.id
            LEFT JOIN course_sections cs ON e.course_section_id = cs.id
            WHERE e.id = ?
        `;

        if (isAdminUser(user)) {
            const [rows] = await db.query(baseQuery, [id]);
            return enrollmentsModel.decorateEnrollmentWithRetakeInfo(rows[0]);
        }

        if (isLecturerUser(user)) {
            const lecturerInfo = await enrollmentsModel.getLecturerInfoByUserId(user.id);

            if (!lecturerInfo) {
                return null;
            }

            const [rows] = await db.query(
                `${baseQuery} AND cs.lecturer_id = ?`,
                [id, lecturerInfo.id]
            );

            return enrollmentsModel.decorateEnrollmentWithRetakeInfo(rows[0]);
        }

        if (isStudentUser(user)) {
            const studentInfo = await enrollmentsModel.getStudentInfoByUserId(user.id);

            if (!studentInfo) {
                return null;
            }

            const [rows] = await db.query(
                `${baseQuery} AND e.student_id = ?`,
                [id, studentInfo.id]
            );

            return enrollmentsModel.decorateEnrollmentWithRetakeInfo(rows[0]);
        }

        return null;
    },

    getCourseSectionById: async (courseSectionId) => {
        const [rows] = await db.query(
            `SELECT
                cs.id,
                cs.subject_id,
                cs.lecturer_id,
                cs.semester_id,
                cs.max_students,
                s.faculty_id AS subject_faculty_id
             FROM course_sections cs
             INNER JOIN subjects s ON cs.subject_id = s.id
             WHERE cs.id = ?
             LIMIT 1`,
            [courseSectionId]
        );

        return rows[0];
    },

    getEnrollmentById: async (id) => {
        const [rows] = await db.query(
            `SELECT id, student_id, course_section_id, status
             FROM enrollments
             WHERE id = ?
             LIMIT 1`,
            [id]
        );

        return rows[0];
    },

    getEnrollmentClassificationByStudentAndSubject: async (studentId, subjectId, options = {}) => {
        const params = [
            RETAKE_SCORE_THRESHOLD,
            RETAKE_SCORE_THRESHOLD,
            RETAKE_SCORE_THRESHOLD,
            studentId,
            subjectId
        ];

        let query = `
            SELECT
                COALESCE(MAX(CASE WHEN g.total_score < ? THEN 1 ELSE 0 END), 0) AS has_failed_attempt,
                COALESCE(MAX(CASE WHEN g.total_score >= ? THEN 1 ELSE 0 END), 0) AS has_passed_attempt,
                COALESCE(MAX(CASE WHEN g.total_score >= ? THEN g.total_score ELSE NULL END), NULL) AS best_passed_score
            FROM enrollments e
            INNER JOIN course_sections cs ON e.course_section_id = cs.id
            INNER JOIN grades g ON g.enrollment_id = e.id
            WHERE e.student_id = ?
              AND cs.subject_id = ?
        `;

        if (options.excludeEnrollmentId) {
            query += " AND e.id <> ?";
            params.push(Number(options.excludeEnrollmentId));
        }

        if (options.beforeEnrollmentId) {
            query += " AND e.id < ?";
            params.push(Number(options.beforeEnrollmentId));
        }

        const [rows] = await db.query(query, params);
        const hasFailedAttempt = Boolean(Number(rows[0]?.has_failed_attempt || 0));
        const hasPassedAttempt = Boolean(Number(rows[0]?.has_passed_attempt || 0));
        const bestPassedScore = rows[0]?.best_passed_score == null
            ? null
            : Number(rows[0].best_passed_score);
        const isRetake = hasFailedAttempt && !hasPassedAttempt;
        const isImprovement = hasPassedAttempt &&
            bestPassedScore !== null &&
            bestPassedScore >= RETAKE_SCORE_THRESHOLD &&
            bestPassedScore <= IMPROVEMENT_SCORE_UPPER_BOUND;

        return {
            has_failed_attempt: hasFailedAttempt,
            has_passed_attempt: hasPassedAttempt,
            best_passed_score: bestPassedScore,
            ...buildEnrollmentTypePayload({
                isRetake,
                isImprovement
            })
        };
    },

    getEnrollmentClassificationByStudentAndCourseSection: async (studentId, courseSectionId, options = {}) => {
        const courseSection = await enrollmentsModel.getCourseSectionById(courseSectionId);

        if (!courseSection) {
            return {
                has_failed_attempt: false,
                has_passed_attempt: false,
                best_passed_score: null,
                ...buildEnrollmentTypePayload({
                    isRetake: false,
                    isImprovement: false
                })
            };
        }

        return enrollmentsModel.getEnrollmentClassificationByStudentAndSubject(
            studentId,
            courseSection.subject_id,
            options
        );
    },

    decorateEnrollmentWithRetakeInfo: async (enrollment) => {
        if (!enrollment || !enrollment.student_id || !enrollment.subject_id) {
            return enrollment;
        }

        const enrollmentClassification = await enrollmentsModel.getEnrollmentClassificationByStudentAndSubject(
            enrollment.student_id,
            enrollment.subject_id,
            {
                beforeEnrollmentId: enrollment.id
            }
        );

        return {
            ...enrollment,
            is_retake: enrollmentClassification.is_retake,
            is_improvement: enrollmentClassification.is_improvement,
            enrollment_type: enrollmentClassification.enrollment_type,
            is_current_registration: isCurrentRegistrationStatus(enrollment.status)
        };
    },

    findDuplicateEnrollment: async (studentId, courseSectionId, excludeEnrollmentId = null) => {
        const params = [
            studentId,
            courseSectionId,
            ...NON_BLOCKING_REGISTRATION_STATUSES
        ];

        let query = `
            SELECT id, status
            FROM enrollments
            WHERE student_id = ?
              AND course_section_id = ?
              AND LOWER(COALESCE(status, '')) NOT IN (${buildNonBlockingRegistrationStatusPlaceholders()})
        `;

        if (excludeEnrollmentId) {
            query += " AND id <> ?";
            params.push(excludeEnrollmentId);
        }

        query += " LIMIT 1";

        const [rows] = await db.query(query, params);
        return rows[0];
    },

    findSameSubjectEnrollment: async (studentId, courseSectionId, excludeEnrollmentId = null) => {
        const params = [
            studentId,
            courseSectionId,
            ...NON_BLOCKING_REGISTRATION_STATUSES
        ];

        let query = `
            SELECT
                e.id,
                e.course_section_id,
                e.status,
                cs.subject_id,
                cs.semester_id
            FROM enrollments e
            INNER JOIN course_sections cs ON e.course_section_id = cs.id
            WHERE e.student_id = ?
              AND LOWER(COALESCE(e.status, '')) NOT IN (${buildNonBlockingRegistrationStatusPlaceholders()})
              AND (cs.subject_id, cs.semester_id) = (
                    SELECT subject_id, semester_id
                    FROM course_sections
                    WHERE id = ?
              )
        `;

        if (excludeEnrollmentId) {
            query += " AND e.id <> ?";
            params.push(excludeEnrollmentId);
        }

        query += " LIMIT 1";

        const [rows] = await db.query(query, params);
        return rows[0];
    },

    getMissingPrerequisites: async (studentId, courseSectionId) => {
        const [rows] = await db.query(
            `SELECT
                sp.prerequisite_id,
                s.subject_code AS prerequisite_code,
                s.name AS prerequisite_name
             FROM course_sections cs
             INNER JOIN subject_prerequisites sp ON cs.subject_id = sp.subject_id
             INNER JOIN subjects s ON sp.prerequisite_id = s.id
             WHERE cs.id = ?
               AND NOT EXISTS (
                    SELECT 1
                    FROM enrollments e
                    INNER JOIN course_sections prerequisite_cs ON e.course_section_id = prerequisite_cs.id
                    INNER JOIN grades g ON g.enrollment_id = e.id
                    WHERE e.student_id = ?
                      AND prerequisite_cs.subject_id = sp.prerequisite_id
                      AND g.total_score >= ?
               )
             ORDER BY s.name ASC`,
            [courseSectionId, studentId, RETAKE_SCORE_THRESHOLD]
        );

        return rows;
    },

    findScheduleConflict: async (studentId, courseSectionId, excludeEnrollmentId = null) => {
        const params = [
            courseSectionId,
            studentId,
            ...NON_PARTICIPATING_ENROLLMENT_STATUSES
        ];

        let query = `
            SELECT
                e.id AS enrollment_id,
                e.course_section_id,
                target.day_of_week,
                target.start_time AS new_start_time,
                target.end_time AS new_end_time,
                existing.start_time AS current_start_time,
                existing.end_time AS current_end_time
            FROM enrollments e
            INNER JOIN schedules existing ON e.course_section_id = existing.course_section_id
            INNER JOIN schedules target ON target.course_section_id = ?
            INNER JOIN course_sections current_section ON current_section.id = e.course_section_id
            INNER JOIN course_sections target_section ON target_section.id = target.course_section_id
            WHERE e.student_id = ?
              AND LOWER(COALESCE(e.status, '')) NOT IN (${buildNonParticipatingStatusPlaceholders()})
              AND current_section.semester_id = target_section.semester_id
              AND existing.day_of_week = target.day_of_week
              AND existing.start_time < target.end_time
              AND existing.end_time > target.start_time
        `;

        if (excludeEnrollmentId) {
            query += " AND e.id <> ?";
            params.push(excludeEnrollmentId);
        }

        query += " LIMIT 1";

        const [rows] = await db.query(query, params);
        return rows[0];
    },

    countActiveEnrollmentsByCourseSection: async (courseSectionId, excludeEnrollmentId = null) => {
        const params = [
            courseSectionId,
            ...NON_PARTICIPATING_ENROLLMENT_STATUSES
        ];

        let query = `
            SELECT COUNT(*) AS total
            FROM enrollments
            WHERE course_section_id = ?
              AND LOWER(COALESCE(status, '')) NOT IN (${buildNonParticipatingStatusPlaceholders()})
        `;

        if (excludeEnrollmentId) {
            query += " AND id <> ?";
            params.push(excludeEnrollmentId);
        }

        const [rows] = await db.query(query, params);
        return Number(rows[0]?.total || 0);
    },

    getCurrentEnrollmentForCourseSection: async (studentId, courseSectionId) => {
        const [rows] = await db.query(
            `SELECT id, status
             FROM enrollments
             WHERE student_id = ?
               AND course_section_id = ?
               AND LOWER(COALESCE(status, '')) NOT IN (${buildNonBlockingRegistrationStatusPlaceholders()})
             ORDER BY id DESC
             LIMIT 1`,
            [studentId, courseSectionId, ...NON_BLOCKING_REGISTRATION_STATUSES]
        );

        return rows[0] || null;
    },

    getEnrollmentByStudentAndCourseSection: async (studentId, courseSectionId, excludeEnrollmentId = null) => {
        const params = [studentId, courseSectionId];
        let query = `
            SELECT id, status
            FROM enrollments
            WHERE student_id = ?
              AND course_section_id = ?
        `;

        if (excludeEnrollmentId) {
            query += " AND id <> ?";
            params.push(Number(excludeEnrollmentId));
        }

        query += " ORDER BY id DESC LIMIT 1";

        const [rows] = await db.query(
            query,
            params
        );

        return rows[0] || null;
    },

    validateEnrollmentPayload: async (studentId, courseSectionId, excludeEnrollmentId = null) => {
        const courseSection = await enrollmentsModel.getCourseSectionById(courseSectionId);
        const studentContext = await enrollmentsModel.getStudentAcademicContextById(studentId);

        if (!courseSection) {
            return {
                ok: false,
                code: 404,
                message: "Khong tim thay lop hoc phan"
            };
        }

        if (!studentContext) {
            return {
                ok: false,
                code: 404,
                message: "Khong tim thay thong tin sinh vien"
            };
        }

        if (String(studentContext.status || "").toLowerCase() !== "active") {
            return {
                ok: false,
                code: 409,
                message: "Sinh vien khong o trang thai duoc phep dang ky hoc"
            };
        }

        if (Number(studentContext.class_faculty_id) !== Number(courseSection.subject_faculty_id)) {
            return {
                ok: false,
                code: 409,
                message: "Sinh vien chi duoc dang ky hoc phan thuoc khoa phu hop voi lop hien tai"
            };
        }

        const anyEnrollmentInSameSection = await enrollmentsModel.getEnrollmentByStudentAndCourseSection(
            studentId,
            courseSectionId,
            excludeEnrollmentId
        );

        if (anyEnrollmentInSameSection) {
            return {
                ok: false,
                code: 409,
                message: "Sinh vien da co lich su dang ky lop hoc phan nay. Hay chon lop hoc phan moi de hoc lai hoac cai thien."
            };
        }

        const duplicateEnrollment = await enrollmentsModel.findDuplicateEnrollment(
            studentId,
            courseSectionId,
            excludeEnrollmentId
        );

        if (duplicateEnrollment) {
            return {
                ok: false,
                code: 409,
                message: "Sinh vien da dang ky hoc phan nay"
            };
        }

        const sameSubjectEnrollment = await enrollmentsModel.findSameSubjectEnrollment(
            studentId,
            courseSectionId,
            excludeEnrollmentId
        );

        if (sameSubjectEnrollment) {
            return {
                ok: false,
                code: 409,
                message: "Sinh vien da dang ky mon hoc nay trong hoc ky hien tai"
            };
        }

        const enrollmentClassification = await enrollmentsModel.getEnrollmentClassificationByStudentAndCourseSection(
            studentId,
            courseSectionId,
            excludeEnrollmentId ? { excludeEnrollmentId } : {}
        );

        const shouldRequirePrerequisites = enrollmentClassification.enrollment_type === "hoc_di";

        if (shouldRequirePrerequisites) {
            const missingPrerequisites = await enrollmentsModel.getMissingPrerequisites(
                studentId,
                courseSectionId
            );

            if (missingPrerequisites.length > 0) {
                return {
                    ok: false,
                    code: 409,
                    message: `Chua dat mon tien quyet: ${missingPrerequisites
                        .map((item) => item.prerequisite_name)
                        .join(", ")}`
                };
            }
        }

        const scheduleConflict = await enrollmentsModel.findScheduleConflict(
            studentId,
            courseSectionId,
            excludeEnrollmentId
        );

        if (scheduleConflict) {
            return {
                ok: false,
                code: 409,
                message: "Lich hoc bi trung voi hoc phan khac"
            };
        }

        const currentEnrollmentTotal = await enrollmentsModel.countActiveEnrollmentsByCourseSection(
            courseSectionId,
            excludeEnrollmentId
        );

        if (
            courseSection.max_students != null &&
            Number(courseSection.max_students) > 0 &&
            currentEnrollmentTotal >= Number(courseSection.max_students)
        ) {
            return {
                ok: false,
                code: 409,
                message: "Hoc phan da du so luong sinh vien"
            };
        }

        return {
            ok: true,
            courseSection
        };
    },

    create: async (data) => {
        const { student_id, course_section_id, status } = data;

        const [result] = await db.query(
            `INSERT INTO enrollments (student_id, course_section_id, status)
             VALUES (?, ?, ?)`,
            [student_id, course_section_id, status]
        );

        return result;
    },

    update: async (id, data) => {
        const { student_id, course_section_id, status } = data;

        const [result] = await db.query(
            `UPDATE enrollments
             SET student_id = ?, course_section_id = ?, status = ?
             WHERE id = ?`,
            [student_id, course_section_id, status, id]
        );

        return result;
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM enrollments WHERE id = ?",
            [id]
        );

        return result;
    }
};

module.exports = enrollmentsModel;
