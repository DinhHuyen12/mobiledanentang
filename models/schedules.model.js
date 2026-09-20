const db = require("../config/db");

const NON_CURRENT_ENROLLMENT_STATUSES = ["pending", "cancelled", "canceled", "dropped", "completed", "rejected"];
const isAdminUser = (user) => Number(user?.role_id || user?.role) === 1;
const isLecturerUser = (user) => Number(user?.role_id || user?.role) === 2;
const isStudentUser = (user) => Number(user?.role_id || user?.role) === 3;

const schedulesModel = {
    getAll: async () => {
        const [rows] = await db.query(`
            SELECT
                sc.id,
                sc.course_section_id,
                cs.subject_id,
                s.name AS subject_name,
                cs.lecturer_id,
                u.full_name AS lecturer_name,
                cs.semester_id,
                sem.name AS semester_name,
                sc.day_of_week,
                sc.start_time,
                sc.end_time,
                sc.room,
                sc.created_at
            FROM schedules sc
            LEFT JOIN course_sections cs ON sc.course_section_id = cs.id
            LEFT JOIN subjects s ON cs.subject_id = s.id
            LEFT JOIN lecturer_info li ON cs.lecturer_id = li.id
            LEFT JOIN users u ON li.user_id = u.id
            LEFT JOIN semesters sem ON cs.semester_id = sem.id
            ORDER BY sc.id ASC
        `);

        return rows;
    },

    getAllForUser: async (user) => {
        if (isAdminUser(user)) {
            return schedulesModel.getAll();
        }

        if (isLecturerUser(user)) {
            const lecturerInfo = await schedulesModel.getLecturerInfoByUserId(user.id);

            if (!lecturerInfo) {
                return [];
            }

            const [rows] = await db.query(
                `SELECT
                    sc.id,
                    sc.course_section_id,
                    cs.subject_id,
                    s.name AS subject_name,
                    cs.lecturer_id,
                    u.full_name AS lecturer_name,
                    cs.semester_id,
                    sem.name AS semester_name,
                    sc.day_of_week,
                    sc.start_time,
                    sc.end_time,
                    sc.room,
                    sc.created_at
                 FROM schedules sc
                 INNER JOIN course_sections cs ON sc.course_section_id = cs.id
                 INNER JOIN subjects s ON cs.subject_id = s.id
                 LEFT JOIN lecturer_info li ON cs.lecturer_id = li.id
                 LEFT JOIN users u ON li.user_id = u.id
                 LEFT JOIN semesters sem ON cs.semester_id = sem.id
                 WHERE cs.lecturer_id = ?
                 ORDER BY sem.id ASC, sc.day_of_week ASC, sc.start_time ASC, sc.id ASC`,
                [lecturerInfo.id]
            );

            return rows;
        }

        if (isStudentUser(user)) {
            const [studentRows] = await db.query(
                `SELECT id
                 FROM student_info
                 WHERE user_id = ?
                 LIMIT 1`,
                [user.id]
            );

            if (!studentRows[0]) {
                return [];
            }

            const [rows] = await db.query(
                `SELECT
                    sc.id,
                    sc.course_section_id,
                    cs.subject_id,
                    s.name AS subject_name,
                    cs.lecturer_id,
                    u.full_name AS lecturer_name,
                    cs.semester_id,
                    sem.name AS semester_name,
                    sc.day_of_week,
                    sc.start_time,
                    sc.end_time,
                    sc.room,
                    sc.created_at,
                    e.id AS enrollment_id,
                    e.status AS enrollment_status,
                    CASE
                        WHEN COALESCE(history.has_failed_attempt, 0) = 1 AND COALESCE(history.has_passed_attempt, 0) = 0 THEN 1
                        ELSE 0
                    END AS is_retake,
                    CASE
                        WHEN COALESCE(history.has_passed_attempt, 0) = 1
                         AND history.best_passed_score >= 5
                         AND history.best_passed_score <= 8 THEN 1
                        ELSE 0
                    END AS is_improvement,
                    CASE
                        WHEN COALESCE(history.has_failed_attempt, 0) = 1 AND COALESCE(history.has_passed_attempt, 0) = 0 THEN 'hoc_lai'
                        WHEN COALESCE(history.has_passed_attempt, 0) = 1
                         AND history.best_passed_score >= 5
                         AND history.best_passed_score <= 8 THEN 'hoc_cai_thien'
                        ELSE 'hoc_di'
                    END AS enrollment_type
                 FROM schedules sc
                 INNER JOIN course_sections cs ON sc.course_section_id = cs.id
                 INNER JOIN subjects s ON cs.subject_id = s.id
                 INNER JOIN enrollments e ON e.course_section_id = cs.id
                 LEFT JOIN lecturer_info li ON cs.lecturer_id = li.id
                 LEFT JOIN users u ON li.user_id = u.id
                 LEFT JOIN semesters sem ON cs.semester_id = sem.id
                 LEFT JOIN (
                    SELECT
                        current_enrollment.id AS enrollment_id,
                        (
                            SELECT COALESCE(MAX(CASE WHEN previous_grade.total_score < 5 THEN 1 ELSE 0 END), 0)
                            FROM enrollments previous_enrollment
                            INNER JOIN course_sections previous_course_section
                                ON previous_enrollment.course_section_id = previous_course_section.id
                            INNER JOIN grades previous_grade
                                ON previous_grade.enrollment_id = previous_enrollment.id
                            WHERE previous_enrollment.student_id = current_enrollment.student_id
                              AND previous_course_section.subject_id = current_course_section.subject_id
                              AND previous_enrollment.id < current_enrollment.id
                        ) AS has_failed_attempt,
                        (
                            SELECT COALESCE(MAX(CASE WHEN previous_grade.total_score >= 5 THEN 1 ELSE 0 END), 0)
                            FROM enrollments previous_enrollment
                            INNER JOIN course_sections previous_course_section
                                ON previous_enrollment.course_section_id = previous_course_section.id
                            INNER JOIN grades previous_grade
                                ON previous_grade.enrollment_id = previous_enrollment.id
                            WHERE previous_enrollment.student_id = current_enrollment.student_id
                              AND previous_course_section.subject_id = current_course_section.subject_id
                              AND previous_enrollment.id < current_enrollment.id
                        ) AS has_passed_attempt,
                        (
                            SELECT MAX(previous_grade.total_score)
                            FROM enrollments previous_enrollment
                            INNER JOIN course_sections previous_course_section
                                ON previous_enrollment.course_section_id = previous_course_section.id
                            INNER JOIN grades previous_grade
                                ON previous_grade.enrollment_id = previous_enrollment.id
                            WHERE previous_enrollment.student_id = current_enrollment.student_id
                              AND previous_course_section.subject_id = current_course_section.subject_id
                              AND previous_grade.total_score >= 5
                              AND previous_enrollment.id < current_enrollment.id
                        ) AS best_passed_score
                    FROM enrollments current_enrollment
                    INNER JOIN course_sections current_course_section
                        ON current_enrollment.course_section_id = current_course_section.id
                 ) history ON history.enrollment_id = e.id
                 WHERE e.student_id = ?
                   AND LOWER(COALESCE(e.status, '')) NOT IN (?, ?, ?, ?, ?, ?)
                 ORDER BY sem.id ASC, sc.day_of_week ASC, sc.start_time ASC, sc.id ASC`,
                [studentRows[0].id, ...NON_CURRENT_ENROLLMENT_STATUSES]
            );

            return rows.map((row) => ({
                ...row,
                is_retake: Boolean(Number(row.is_retake || 0)),
                is_improvement: Boolean(Number(row.is_improvement || 0))
            }));
        }

        return [];
    },

    getById: async (id) => {
        const [rows] = await db.query(`
            SELECT
                sc.id,
                sc.course_section_id,
                cs.subject_id,
                s.name AS subject_name,
                cs.lecturer_id,
                u.full_name AS lecturer_name,
                cs.semester_id,
                sem.name AS semester_name,
                sc.day_of_week,
                sc.start_time,
                sc.end_time,
                sc.room,
                sc.created_at
            FROM schedules sc
            LEFT JOIN course_sections cs ON sc.course_section_id = cs.id
            LEFT JOIN subjects s ON cs.subject_id = s.id
            LEFT JOIN lecturer_info li ON cs.lecturer_id = li.id
            LEFT JOIN users u ON li.user_id = u.id
            LEFT JOIN semesters sem ON cs.semester_id = sem.id
            WHERE sc.id = ?
        `, [id]);

        return rows[0];
    },

    getCourseSectionById: async (courseSectionId) => {
        const [rows] = await db.query(
            `SELECT id, subject_id, lecturer_id, semester_id, max_students
             FROM course_sections
             WHERE id = ?
             LIMIT 1`,
            [courseSectionId]
        );

        return rows[0];
    },

    getScheduleById: async (id) => {
        const [rows] = await db.query(
            `SELECT id, course_section_id, day_of_week, start_time, end_time, room
             FROM schedules
             WHERE id = ?
             LIMIT 1`,
            [id]
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

    findRoomConflict: async (dayOfWeek, startTime, endTime, room, excludeScheduleId = null) => {
        if (!room) {
            return null;
        }

        const params = [dayOfWeek, endTime, startTime, room];
        let query = `
            SELECT id, course_section_id, room
            FROM schedules
            WHERE day_of_week = ?
              AND start_time < ?
              AND end_time > ?
              AND room = ?
        `;

        if (excludeScheduleId) {
            query += " AND id <> ?";
            params.push(excludeScheduleId);
        }

        query += " LIMIT 1";

        const [rows] = await db.query(query, params);
        return rows[0];
    },

    findLecturerConflict: async (courseSectionId, dayOfWeek, startTime, endTime, excludeScheduleId = null) => {
        const params = [courseSectionId, dayOfWeek, endTime, startTime];
        let query = `
            SELECT
                sc.id,
                sc.course_section_id,
                cs.lecturer_id
            FROM schedules sc
            INNER JOIN course_sections cs ON sc.course_section_id = cs.id
            WHERE cs.lecturer_id = (
                    SELECT lecturer_id
                    FROM course_sections
                    WHERE id = ?
              )
              AND sc.day_of_week = ?
              AND sc.start_time < ?
              AND sc.end_time > ?
        `;

        if (excludeScheduleId) {
            query += " AND sc.id <> ?";
            params.push(excludeScheduleId);
        }

        query += " LIMIT 1";

        const [rows] = await db.query(query, params);
        return rows[0];
    },

    validateSchedulePayload: async (data, excludeScheduleId = null) => {
        const {
            course_section_id,
            day_of_week,
            start_time,
            end_time,
            room
        } = data;

        const courseSection = await schedulesModel.getCourseSectionById(course_section_id);

        if (!courseSection) {
            return {
                ok: false,
                code: 404,
                message: "Khong tim thay lop hoc phan"
            };
        }

        if (start_time >= end_time) {
            return {
                ok: false,
                code: 400,
                message: "start_time phai nho hon end_time"
            };
        }

        const lecturerConflict = await schedulesModel.findLecturerConflict(
            course_section_id,
            day_of_week,
            start_time,
            end_time,
            excludeScheduleId
        );

        if (lecturerConflict) {
            return {
                ok: false,
                code: 409,
                message: "Giang vien bi trung lich day"
            };
        }

        const roomConflict = await schedulesModel.findRoomConflict(
            day_of_week,
            start_time,
            end_time,
            room,
            excludeScheduleId
        );

        if (roomConflict) {
            return {
                ok: false,
                code: 409,
                message: "Phong hoc da duoc su dung o khung gio nay"
            };
        }

        return {
            ok: true,
            courseSection
        };
    },

    create: async (data) => {
        const { course_section_id, day_of_week, start_time, end_time, room } = data;

        const [result] = await db.query(
            `INSERT INTO schedules (course_section_id, day_of_week, start_time, end_time, room)
             VALUES (?, ?, ?, ?, ?)`,
            [course_section_id, day_of_week, start_time, end_time, room || null]
        );

        return result;
    },

    update: async (id, data) => {
        const { course_section_id, day_of_week, start_time, end_time, room } = data;

        const [result] = await db.query(
            `UPDATE schedules
             SET course_section_id = ?, day_of_week = ?, start_time = ?, end_time = ?, room = ?
             WHERE id = ?`,
            [course_section_id, day_of_week, start_time, end_time, room || null, id]
        );

        return result;
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM schedules WHERE id = ?",
            [id]
        );

        return result;
    }
};

module.exports = schedulesModel;
