const db = require("../config/db");
const enrollmentsModel = require("./enrollments.model");
const { createAppError, isPositiveInteger } = require("../utils/validation");

const isStudentUser = (user) => Number(user?.role_id || user?.role) === 3;

const decorateCourseSectionWithRetakeInfo = async (courseSection, studentId) => {
    if (!courseSection) {
        return courseSection;
    }

    if (!studentId) {
        return {
            ...courseSection,
            is_retake: false,
            is_improvement: false,
            enrollment_type: "hoc_di",
            is_registered: false,
            registered_enrollment_id: null,
            registered_enrollment_status: null
        };
    }

    const enrollmentClassification = await enrollmentsModel.getEnrollmentClassificationByStudentAndSubject(
        studentId,
        courseSection.subject_id
    );
    const currentEnrollment = await enrollmentsModel.getCurrentEnrollmentForCourseSection(
        studentId,
        courseSection.id
    );
    const previousEnrollment = currentEnrollment || await enrollmentsModel.getEnrollmentByStudentAndCourseSection(
        studentId,
        courseSection.id
    );

    return {
        ...courseSection,
        is_retake: enrollmentClassification.is_retake,
        is_improvement: enrollmentClassification.is_improvement,
        enrollment_type: enrollmentClassification.enrollment_type,
        is_registered: Boolean(previousEnrollment),
        registered_enrollment_id: previousEnrollment?.id || null,
        registered_enrollment_status: previousEnrollment?.status || null
    };
};

const normalizeDisplayRows = async (rows, studentId) => {
    const courseSectionMap = new Map();

    for (const row of rows) {
        const existingCourseSection = courseSectionMap.get(row.id);

        if (!existingCourseSection) {
            const decoratedCourseSection = await decorateCourseSectionWithRetakeInfo(
                {
                    id: row.id,
                    subject_id: row.subject_id,
                    subject_name: row.subject_name,
                    semester_id: row.semester_id,
                    semester_name: row.semester_name,
                    lecturer_id: row.lecturer_id,
                    lecturer_name: row.lecturer_name || `Giang vien ID #${row.lecturer_id}`,
                    max_students: row.max_students,
                    schedules: [],
                    rooms: [],
                    schedule_text: "",
                    room_text: ""
                },
                studentId
            );

            courseSectionMap.set(row.id, decoratedCourseSection);
        }

        const currentCourseSection = courseSectionMap.get(row.id);

        if (row.schedule_id) {
            currentCourseSection.schedules.push({
                id: row.schedule_id,
                day_of_week: row.day_of_week,
                start_time: row.start_time,
                end_time: row.end_time,
                room: row.room
            });

            if (row.room && !currentCourseSection.rooms.includes(row.room)) {
                currentCourseSection.rooms.push(row.room);
            }
        }
    }

    return Array.from(courseSectionMap.values()).map((courseSection) => ({
        ...courseSection,
        room_text: courseSection.rooms.join(" | "),
        schedule_text: courseSection.schedules
            .map((schedule) => `${schedule.day_of_week} ${schedule.start_time}-${schedule.end_time}`)
            .join(" | ")
    }));
};

exports.getAll = async (user) => {
    let studentId = null;

    if (isStudentUser(user)) {
        const studentInfo = await enrollmentsModel.getStudentInfoByUserId(user.id);
        studentId = studentInfo?.id || null;
    }

    const [rows] = await db.query(`
        SELECT cs.id,
               s.id AS subject_id,
               s.name AS subject,
               s.name AS subject_name,
               s.faculty_id AS subject_faculty_id,
               l.id AS lecturer_id,
               u.full_name AS lecturer_name,
               sem.name AS semester,
               sc.id AS schedule_id,
               sc.day_of_week,
               sc.start_time,
               sc.end_time,
               sc.room,
               cs.max_students
        FROM course_sections cs
        JOIN subjects s ON cs.subject_id = s.id
        JOIN semesters sem ON cs.semester_id = sem.id
        LEFT JOIN lecturer_info l ON cs.lecturer_id = l.id
        LEFT JOIN users u ON l.user_id = u.id
        LEFT JOIN schedules sc ON cs.id = sc.course_section_id
        ORDER BY cs.id ASC, sc.day_of_week ASC, sc.start_time ASC
    `);

    return Promise.all(rows.map((row) => decorateCourseSectionWithRetakeInfo(row, studentId)));
};

exports.getRegistrationDisplayInfo = async (user) => {
    let studentId = null;

    if (isStudentUser(user)) {
        const studentInfo = await enrollmentsModel.getStudentInfoByUserId(user.id);
        studentId = studentInfo?.id || null;
    }

    const [rows] = await db.query(`
        SELECT
            cs.id,
            cs.subject_id,
            s.name AS subject_name,
            s.faculty_id AS subject_faculty_id,
            cs.semester_id,
            sem.name AS semester_name,
            cs.lecturer_id,
            u.full_name AS lecturer_name,
            cs.max_students,
            sc.id AS schedule_id,
            sc.day_of_week,
            TIME_FORMAT(sc.start_time, '%H:%i') AS start_time,
            TIME_FORMAT(sc.end_time, '%H:%i') AS end_time,
            sc.room
        FROM course_sections cs
        JOIN subjects s ON cs.subject_id = s.id
        JOIN semesters sem ON cs.semester_id = sem.id
        LEFT JOIN lecturer_info li ON cs.lecturer_id = li.id
        LEFT JOIN users u ON li.user_id = u.id
        LEFT JOIN schedules sc ON cs.id = sc.course_section_id
        ORDER BY cs.id ASC, sc.day_of_week ASC, sc.start_time ASC
    `);

    const normalizedRows = await normalizeDisplayRows(rows, studentId);

    if (!studentId) {
        return normalizedRows;
    }

    return normalizedRows.filter((courseSection) =>
        !courseSection.is_registered &&
        courseSection.enrollment_type !== "hoc_di"
    );
};

exports.getById = async (id, user) => {
    let studentId = null;

    if (isStudentUser(user)) {
        const studentInfo = await enrollmentsModel.getStudentInfoByUserId(user.id);
        studentId = studentInfo?.id || null;
    }

    const [rows] = await db.query(
        `SELECT cs.*,
                s.id AS subject_id,
                s.name AS subject_name,
                s.faculty_id AS subject_faculty_id,
                li.id AS lecturer_id,
                u.full_name AS lecturer_name,
                sc.id AS schedule_id,
                sc.day_of_week,
                sc.start_time,
                sc.end_time,
                sc.room
         FROM course_sections cs
         JOIN subjects s ON cs.subject_id = s.id
         LEFT JOIN lecturer_info li ON cs.lecturer_id = li.id
         LEFT JOIN users u ON li.user_id = u.id
         LEFT JOIN schedules sc ON cs.id = sc.course_section_id
         WHERE cs.id = ?`,
        [id]
    );

    return decorateCourseSectionWithRetakeInfo(rows[0], studentId);
};

exports.create = async (data) => {
    const { subject_id, lecturer_id, semester_id, max_students } = await exports.validateCourseSectionPayload(data);

    const [result] = await db.query(
        `INSERT INTO course_sections
        (subject_id, lecturer_id, semester_id, max_students)
        VALUES (?,?,?,?)`,
        [subject_id, lecturer_id, semester_id, max_students]
    );

    return result;
};

exports.update = async (id, data) => {
    const { subject_id, lecturer_id, semester_id, max_students } = await exports.validateCourseSectionPayload(data, id);

    const [result] = await db.query(
        `UPDATE course_sections
         SET subject_id=?, lecturer_id=?, semester_id=?, max_students=?
         WHERE id=?`,
        [subject_id, lecturer_id, semester_id, max_students, id]
    );

    return result;
};

exports.delete = async (id) => {
    const [result] = await db.query(
        "DELETE FROM course_sections WHERE id=?",
        [id]
    );

    return result;
};

exports.validateCourseSectionPayload = async (data, excludeId = null) => {
    const subjectId = Number(data.subject_id);
    const lecturerId = Number(data.lecturer_id);
    const semesterId = Number(data.semester_id);
    const maxStudents = Number(data.max_students);

    if (!isPositiveInteger(subjectId) || !isPositiveInteger(lecturerId) || !isPositiveInteger(semesterId)) {
        throw createAppError(400, "subject_id, lecturer_id va semester_id phai la so nguyen duong");
    }

    if (!isPositiveInteger(maxStudents) || maxStudents > 500) {
        throw createAppError(400, "max_students phai la so nguyen duong va khong vuot qua 500");
    }

    const [[subjectRows], [lecturerRows], [semesterRows], [programRows]] = await Promise.all([
        db.query(
            `SELECT id, faculty_id
             FROM subjects
             WHERE id = ?
             LIMIT 1`,
            [subjectId]
        ),
        db.query(
            `SELECT id
             FROM lecturer_info
             WHERE id = ?
             LIMIT 1`,
            [lecturerId]
        ),
        db.query(
            `SELECT id
             FROM semesters
             WHERE id = ?
             LIMIT 1`,
            [semesterId]
        ),
        db.query(
            `SELECT COUNT(DISTINCT tp.faculty_id) AS faculty_total,
                    MIN(tp.faculty_id) AS mapped_faculty_id
             FROM training_program_subjects tps
             INNER JOIN training_programs tp ON tp.id = tps.program_id
             WHERE tps.subject_id = ?`,
            [subjectId]
        )
    ]);

    const subject = subjectRows[0];
    if (!subject) {
        throw createAppError(404, "Khong tim thay mon hoc");
    }

    if (!lecturerRows[0]) {
        throw createAppError(404, "Khong tim thay giang vien");
    }

    if (!semesterRows[0]) {
        throw createAppError(404, "Khong tim thay hoc ky");
    }

    const mappedFacultyTotal = Number(programRows[0]?.faculty_total || 0);
    const mappedFacultyId = Number(programRows[0]?.mapped_faculty_id || 0);

    if (mappedFacultyTotal > 1) {
        throw createAppError(409, "Mon hoc dang duoc lien ket voi nhieu khoa khac nhau trong chuong trinh dao tao");
    }

    if (mappedFacultyTotal === 1 && mappedFacultyId !== Number(subject.faculty_id)) {
        throw createAppError(409, "Mon hoc dang gan voi khoa khong phu hop trong chuong trinh dao tao");
    }

    const params = [subjectId, lecturerId, semesterId];
    let query = `
        SELECT id
        FROM course_sections
        WHERE subject_id = ?
          AND lecturer_id = ?
          AND semester_id = ?
    `;

    if (excludeId) {
        query += " AND id <> ?";
        params.push(Number(excludeId));
    }

    query += " LIMIT 1";
    const [conflictRows] = await db.query(query, params);

    if (conflictRows[0]) {
        throw createAppError(409, "Da ton tai lop hoc phan cung mon hoc, giang vien va hoc ky");
    }

    return {
        subject_id: subjectId,
        lecturer_id: lecturerId,
        semester_id: semesterId,
        max_students: maxStudents
    };
};
