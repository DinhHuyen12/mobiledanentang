require("dotenv").config();

const db = require("../config/db");

const PASSWORD_HASH = "$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS";

const lecturersSeed = [
    {
        username: "gv.phamthuha",
        email: "phamthuha.lecturer@university.local",
        full_name: "Pham Thu Ha",
        phone: "0900010001",
        lecturer_code: "GV010",
        academic_rank: "Thac si",
        specialization: "Tri tue nhan tao"
    },
    {
        username: "gv.nguyenquangminh",
        email: "quangminh.lecturer@university.local",
        full_name: "Nguyen Quang Minh",
        phone: "0900010002",
        lecturer_code: "GV011",
        academic_rank: "Tien si",
        specialization: "He thong thong tin quan ly"
    }
];

const studentPlans = [
    { prefix: "cntta", class_id: 1, faculty_id: 1, program_id: 1, count: 12, names: ["Nguyen Minh An", "Tran Gia Bao", "Le Hoang Nam", "Pham Quoc Dat", "Vo Thanh Long", "Do Anh Khoa", "Bui Duc Huy", "Dang Tuan Kiet", "Hoang Gia Huy", "Phan Minh Quan", "Ngo Tien Dung", "Mai Khanh Toan"] },
    { prefix: "cnttb", class_id: 2, faculty_id: 1, program_id: 1, count: 12, names: ["Nguyen Thu Trang", "Tran Ngoc Linh", "Le Bao Chau", "Pham Nha Uyen", "Vo Quynh Nhu", "Do My Tien", "Bui Lan Anh", "Dang Thuy Duong", "Hoang Ha My", "Phan Diem Quynh", "Ngo Bich Tram", "Mai Thu Hien"] },
    { prefix: "qtkd", class_id: 3, faculty_id: 2, program_id: 2, count: 10, names: ["Nguyen Duc Manh", "Tran Khanh Vy", "Le Phuong Anh", "Pham Hoai Thu", "Vo Huu Phuc", "Doan Bao Nghi", "Bui Thanh Nhan", "Dang Huyen Tram", "Hoang Quoc Thai", "Phan Ngoc Mai"] }
];

const completedSectionPlans = [
    { subject_id: 1, semester_id: 1, faculty_id: 1, section_key: "hk1_it101_a", max_students: 65 },
    { subject_id: 2, semester_id: 1, faculty_id: 1, section_key: "hk1_it102_a", max_students: 65 },
    { subject_id: 7, semester_id: 1, faculty_id: 2, section_key: "hk1_bus101_a", max_students: 70 },
    { subject_id: 10, semester_id: 1, faculty_id: 2, section_key: "hk1_bus102_a", max_students: 70 }
];

const activeSectionPlans = [
    { subject_id: 3, semester_id: 2, faculty_id: 1, section_key: "hk2_it201_a", max_students: 60 },
    { subject_id: 4, semester_id: 2, faculty_id: 1, section_key: "hk2_it202_a", max_students: 60 },
    { subject_id: 8, semester_id: 4, faculty_id: 1, section_key: "hk4_it303_a", max_students: 55 },
    { subject_id: 9, semester_id: 5, faculty_id: 1, section_key: "hk5_it304_a", max_students: 55 },
    { subject_id: 11, semester_id: 2, faculty_id: 2, section_key: "hk2_bus201_a", max_students: 60 },
    { subject_id: 12, semester_id: 2, faculty_id: 2, section_key: "hk2_bus202_a", max_students: 60 }
];

const attendanceSessionTemplates = [
    { offsetDays: -10, start_time: "07:00:00", end_time: "09:00:00", room: "A201", topic: "Buoi hoc ly thuyet" },
    { offsetDays: -7, start_time: "09:15:00", end_time: "11:15:00", room: "A202", topic: "Thao luan va bai tap" },
    { offsetDays: -3, start_time: "13:00:00", end_time: "15:00:00", room: "Lab05", topic: "Thuc hanh va danh gia" }
];

const toSlug = (value) =>
    String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "")
        .trim();

const round1 = (value) => Math.round(value * 10) / 10;

const resolveLetterGrade = (totalScore) => {
    if (totalScore >= 8.5) return "A";
    if (totalScore >= 8.0) return "B+";
    if (totalScore >= 7.0) return "B";
    if (totalScore >= 6.5) return "C+";
    if (totalScore >= 5.5) return "C";
    if (totalScore >= 5.0) return "D+";
    if (totalScore >= 4.0) return "D";
    return "F";
};

const makeStudentUsername = (prefix, index) => `demo.${prefix}.${String(index).padStart(2, "0")}`;

const buildSchedule = (sectionId, sectionKey) => {
    const presets = {
        hk1_it101_a: [
            { day: "Thu 2", start: "07:00:00", end: "09:00:00", room: "A201" },
            { day: "Thu 4", start: "07:00:00", end: "09:00:00", room: "A201" }
        ],
        hk1_it102_a: [
            { day: "Thu 3", start: "09:15:00", end: "11:15:00", room: "A202" },
            { day: "Thu 5", start: "09:15:00", end: "11:15:00", room: "A202" }
        ],
        hk2_it201_a: [
            { day: "Thu 2", start: "13:00:00", end: "15:00:00", room: "B201" }
        ],
        hk2_it202_a: [
            { day: "Thu 3", start: "13:00:00", end: "15:00:00", room: "B202" }
        ],
        hk4_it303_a: [
            { day: "Thu 6", start: "07:00:00", end: "09:00:00", room: "Lab02" }
        ],
        hk5_it304_a: [
            { day: "Thu 5", start: "13:00:00", end: "15:00:00", room: "Lab03" }
        ],
        hk1_bus101_a: [
            { day: "Thu 7", start: "07:00:00", end: "09:00:00", room: "D101" }
        ],
        hk1_bus102_a: [
            { day: "Thu 3", start: "07:00:00", end: "09:00:00", room: "B101" }
        ],
        hk2_bus201_a: [
            { day: "Thu 4", start: "09:15:00", end: "11:15:00", room: "B102" }
        ],
        hk2_bus202_a: [
            { day: "Thu 6", start: "13:00:00", end: "15:00:00", room: "B103" }
        ]
    };

    return (presets[sectionKey] || []).map((item) => ({
        course_section_id: sectionId,
        day_of_week: item.day,
        start_time: item.start,
        end_time: item.end,
        room: item.room
    }));
};

async function ensureUser(connection, data) {
    const [existing] = await connection.query(
        "SELECT id FROM users WHERE username = ? LIMIT 1",
        [data.username]
    );

    if (existing[0]) {
        return existing[0].id;
    }

    const [result] = await connection.query(
        `INSERT INTO users (username, email, password, full_name, phone, role_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.username, data.email, PASSWORD_HASH, data.full_name, data.phone, data.role_id]
    );

    return result.insertId;
}

async function ensureLecturer(connection, seed) {
    const userId = await ensureUser(connection, {
        username: seed.username,
        email: seed.email,
        full_name: seed.full_name,
        phone: seed.phone,
        role_id: 2
    });

    const [existing] = await connection.query(
        "SELECT id FROM lecturer_info WHERE user_id = ? LIMIT 1",
        [userId]
    );

    if (existing[0]) {
        return existing[0].id;
    }

    const [result] = await connection.query(
        `INSERT INTO lecturer_info (user_id, lecturer_code, academic_rank, specialization)
         VALUES (?, ?, ?, ?)`,
        [userId, seed.lecturer_code, seed.academic_rank, seed.specialization]
    );

    return result.insertId;
}

async function ensureStudent(connection, data) {
    const userId = await ensureUser(connection, {
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        role_id: 3
    });

    const [existing] = await connection.query(
        "SELECT id FROM student_info WHERE user_id = ? LIMIT 1",
        [userId]
    );

    let studentId = existing[0]?.id;

    if (!studentId) {
        const [result] = await connection.query(
            `INSERT INTO student_info (user_id, class_id, enrollment_date, status)
             VALUES (?, ?, '2024-09-01', 'active')`,
            [userId, data.class_id]
        );
        studentId = result.insertId;
    }

    const [assigned] = await connection.query(
        "SELECT id FROM student_programs WHERE student_id = ? LIMIT 1",
        [studentId]
    );

    if (!assigned[0]) {
        await connection.query(
            `INSERT INTO student_programs (student_id, program_id, start_date, expected_graduation_date, status)
             VALUES (?, ?, '2024-09-01', '2028-06-30', 'active')`,
            [studentId, data.program_id]
        );
    }

    return { userId, studentId };
}

async function ensureCourseSection(connection, plan, lecturerId) {
    const [existing] = await connection.query(
        `SELECT id
         FROM course_sections
         WHERE subject_id = ? AND lecturer_id = ? AND semester_id = ? AND max_students = ?
         LIMIT 1`,
        [plan.subject_id, lecturerId, plan.semester_id, plan.max_students]
    );

    let sectionId = existing[0]?.id;

    if (!sectionId) {
        const [result] = await connection.query(
            `INSERT INTO course_sections (subject_id, lecturer_id, semester_id, max_students)
             VALUES (?, ?, ?, ?)`,
            [plan.subject_id, lecturerId, plan.semester_id, plan.max_students]
        );
        sectionId = result.insertId;
    }

    const scheduleItems = buildSchedule(sectionId, plan.section_key);
    for (const item of scheduleItems) {
        const [scheduleRows] = await connection.query(
            `SELECT id
             FROM schedules
             WHERE course_section_id = ? AND day_of_week = ? AND start_time = ? AND end_time = ?
             LIMIT 1`,
            [item.course_section_id, item.day_of_week, item.start_time, item.end_time]
        );

        if (!scheduleRows[0]) {
            await connection.query(
                `INSERT INTO schedules (course_section_id, day_of_week, start_time, end_time, room)
                 VALUES (?, ?, ?, ?, ?)`,
                [item.course_section_id, item.day_of_week, item.start_time, item.end_time, item.room]
            );
        }
    }

    return sectionId;
}

async function ensureEnrollment(connection, studentId, sectionId, status) {
    const [rows] = await connection.query(
        `SELECT id FROM enrollments
         WHERE student_id = ? AND course_section_id = ?
         LIMIT 1`,
        [studentId, sectionId]
    );

    if (rows[0]) {
        return rows[0].id;
    }

    const [result] = await connection.query(
        `INSERT INTO enrollments (student_id, course_section_id, status)
         VALUES (?, ?, ?)`,
        [studentId, sectionId, status]
    );

    return result.insertId;
}

async function ensureGrade(connection, enrollmentId, studentId) {
    const [rows] = await connection.query(
        "SELECT id FROM grades WHERE enrollment_id = ? LIMIT 1",
        [enrollmentId]
    );

    if (rows[0]) {
        return;
    }

    const attendance = 5 + ((studentId * 3) % 45) / 10;
    const midterm = 5 + ((studentId * 5) % 40) / 10;
    const finalScore = 4.5 + ((studentId * 7) % 50) / 10;
    const totalScore = round1((((attendance + midterm) / 2) + finalScore) / 2);

    await connection.query(
        `INSERT INTO grades (enrollment_id, attendance_score, midterm_score, final_score, total_score, letter_grade)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [enrollmentId, attendance, midterm, finalScore, totalScore, resolveLetterGrade(totalScore)]
    );
}

async function ensureTuition(connection, studentId, semesterId, totalCredits, amount, paidAmount, status, dueDate) {
    const [rows] = await connection.query(
        "SELECT id FROM tuitions WHERE student_id = ? AND semester_id = ? LIMIT 1",
        [studentId, semesterId]
    );

    let tuitionId = rows[0]?.id;

    if (!tuitionId) {
        const [result] = await connection.query(
            `INSERT INTO tuitions (student_id, semester_id, total_credits, amount, paid_amount, status, due_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [studentId, semesterId, totalCredits, amount, paidAmount, status, dueDate]
        );
        tuitionId = result.insertId;
    }

    if (paidAmount > 0) {
        const [paymentRows] = await connection.query(
            "SELECT id FROM tuition_payments WHERE tuition_id = ? LIMIT 1",
            [tuitionId]
        );

        if (!paymentRows[0]) {
            await connection.query(
                `INSERT INTO tuition_payments (tuition_id, payment_date, amount, payment_method, note)
                 VALUES (?, ?, ?, ?, ?)`,
                [tuitionId, dueDate, paidAmount, paidAmount === amount ? "bank" : "cash", "Demo thanh toan hoc phi"]
            );
        }
    }
}

async function ensureAttendanceForSection(connection, sectionId, createdByUserId, enrollmentRows) {
    for (let index = 0; index < attendanceSessionTemplates.length; index += 1) {
        const template = attendanceSessionTemplates[index];
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() + template.offsetDays);
        const formattedDate = sessionDate.toISOString().slice(0, 10);

        const [existing] = await connection.query(
            `SELECT id
             FROM attendance_sessions
             WHERE course_section_id = ? AND session_date = ? AND start_time = ?
             LIMIT 1`,
            [sectionId, formattedDate, template.start_time]
        );

        let sessionId = existing[0]?.id;

        if (!sessionId) {
            const [result] = await connection.query(
                `INSERT INTO attendance_sessions
                 (course_section_id, schedule_id, session_date, start_time, end_time, room, topic, status, created_by)
                 VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
                [sectionId, formattedDate, template.start_time, template.end_time, template.room, template.topic, "closed", createdByUserId]
            );
            sessionId = result.insertId;
        }

        for (const enrollment of enrollmentRows) {
            const [recordRows] = await connection.query(
                `SELECT id
                 FROM attendance_records
                 WHERE attendance_session_id = ? AND enrollment_id = ?
                 LIMIT 1`,
                [sessionId, enrollment.id]
            );

            if (!recordRows[0]) {
                const statusList = ["present", "present", "present", "late", "excused", "absent"];
                const status = statusList[(enrollment.student_id + index) % statusList.length];

                await connection.query(
                    `INSERT INTO attendance_records
                     (attendance_session_id, enrollment_id, student_id, status, check_in_time, note)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        sessionId,
                        enrollment.id,
                        enrollment.student_id,
                        status,
                        status === "absent" ? null : `${formattedDate} ${template.start_time}`,
                        status === "late" ? "Den muon do ket xe" : null
                    ]
                );
            }
        }
    }
}

async function run() {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const lecturerIds = [];
        for (const seed of lecturersSeed) {
            lecturerIds.push(await ensureLecturer(connection, seed));
        }

        const createdStudents = [];
        for (const plan of studentPlans) {
            for (let index = 0; index < plan.count; index += 1) {
                const sequence = index + 1;
                const username = makeStudentUsername(plan.prefix, sequence);
                const email = `${username}@university.local`;
                const full_name = plan.names[index];
                const phone = `091${String(plan.class_id)}${String(sequence).padStart(7, "0")}`;

                const student = await ensureStudent(connection, {
                    username,
                    email,
                    full_name,
                    phone,
                    class_id: plan.class_id,
                    program_id: plan.program_id
                });

                createdStudents.push({
                    ...student,
                    class_id: plan.class_id,
                    faculty_id: plan.faculty_id,
                    program_id: plan.program_id
                });
            }
        }

        const allStudents = [];
        const [studentRows] = await connection.query(
            `SELECT si.id, si.class_id, c.faculty_id
             FROM student_info si
             INNER JOIN classes c ON si.class_id = c.id`
        );
        for (const row of studentRows) {
            const programId = row.faculty_id === 1 ? 1 : 2;
            allStudents.push({
                studentId: row.id,
                class_id: row.class_id,
                faculty_id: row.faculty_id,
                program_id: programId
            });
        }

        const sectionAssignments = new Map();
        const facultyLecturerMap = {
            1: lecturerIds[0] || 1,
            2: lecturerIds[1] || 2
        };

        for (const plan of [...completedSectionPlans, ...activeSectionPlans]) {
            const lecturerId = facultyLecturerMap[plan.faculty_id];
            const sectionId = await ensureCourseSection(connection, plan, lecturerId);
            sectionAssignments.set(plan.section_key, { ...plan, sectionId, lecturerId });
        }

        for (const student of allStudents) {
            const completedTargets = completedSectionPlans.filter((plan) => plan.faculty_id === student.faculty_id);
            const activeTargets = activeSectionPlans.filter((plan) => plan.faculty_id === student.faculty_id);

            for (const plan of completedTargets) {
                const section = sectionAssignments.get(plan.section_key);
                const enrollmentId = await ensureEnrollment(connection, student.studentId, section.sectionId, "completed");
                await ensureGrade(connection, enrollmentId, student.studentId);
            }

            for (const plan of activeTargets) {
                const section = sectionAssignments.get(plan.section_key);
                await ensureEnrollment(connection, student.studentId, section.sectionId, "active");
            }

            if (student.faculty_id === 1) {
                const scoreBucket = student.studentId % 3;
                const hk1PaidAmount = scoreBucket === 0 ? 0 : scoreBucket === 1 ? 2500000 : 4500000;
                const hk1Status = hk1PaidAmount === 4500000 ? "paid" : hk1PaidAmount === 0 ? "unpaid" : "partial";
                await ensureTuition(connection, student.studentId, 1, 6, 4500000, hk1PaidAmount, hk1Status, "2024-10-15");
                await ensureTuition(connection, student.studentId, 2, 6, 4800000, 0, "unpaid", "2025-03-15");
            } else {
                const paidAmount = student.studentId % 2 === 0 ? 1800000 : 0;
                await ensureTuition(connection, student.studentId, 1, 4, 3000000, paidAmount, paidAmount ? "partial" : "unpaid", "2024-10-20");
                await ensureTuition(connection, student.studentId, 2, 4, 3200000, 0, "unpaid", "2025-03-20");
            }
        }

        const [completedEnrollments] = await connection.query(
            `SELECT e.id, e.student_id, cs.id AS section_id, cs.lecturer_id
             FROM enrollments e
             INNER JOIN course_sections cs ON e.course_section_id = cs.id
             WHERE e.status = 'active'
             ORDER BY cs.id ASC, e.student_id ASC`
        );

        const enrollmentsBySection = new Map();
        for (const row of completedEnrollments) {
            if (!enrollmentsBySection.has(row.section_id)) {
                enrollmentsBySection.set(row.section_id, {
                    lecturer_id: row.lecturer_id,
                    rows: []
                });
            }
            enrollmentsBySection.get(row.section_id).rows.push(row);
        }

        for (const [sectionId, info] of enrollmentsBySection.entries()) {
            const [lecturerUserRows] = await connection.query(
                "SELECT user_id FROM lecturer_info WHERE id = ? LIMIT 1",
                [info.lecturer_id]
            );
            const createdByUserId = lecturerUserRows[0]?.user_id || 1;
            await ensureAttendanceForSection(connection, sectionId, createdByUserId, info.rows);
        }

        const [highPerformers] = await connection.query(
            `SELECT si.id AS student_id
             FROM student_info si
             INNER JOIN users u ON si.user_id = u.id
             WHERE u.username LIKE 'demo.%'
             ORDER BY si.id ASC
             LIMIT 6`
        );

        for (let index = 0; index < highPerformers.length; index += 1) {
            const studentId = highPerformers[index].student_id;
            const scholarshipId = index % 2 === 0 ? 1 : 3;
            const [awardRows] = await connection.query(
                `SELECT id
                 FROM student_scholarships
                 WHERE scholarship_id = ? AND student_id = ?
                 LIMIT 1`,
                [scholarshipId, studentId]
            );

            if (!awardRows[0]) {
                await connection.query(
                    `INSERT INTO student_scholarships (scholarship_id, student_id, awarded_date, note, status)
                     VALUES (?, ?, ?, ?, 'approved')`,
                    [scholarshipId, studentId, "2025-03-25", "Hoc bong demo theo thanh tich hoc tap"]
                );
            }
        }

        const [disciplineRows] = await connection.query(
            `SELECT si.id AS student_id
             FROM student_info si
             INNER JOIN users u ON si.user_id = u.id
             WHERE u.username LIKE 'demo.%'
             ORDER BY si.id DESC
             LIMIT 4`
        );

        for (const row of disciplineRows) {
            const [existing] = await connection.query(
                `SELECT id
                 FROM disciplinary_actions
                 WHERE student_id = ? AND title = 'Nhac nho chuyen can'
                 LIMIT 1`,
                [row.student_id]
            );

            if (!existing[0]) {
                await connection.query(
                    `INSERT INTO disciplinary_actions
                     (student_id, semester_id, title, description, level, decision_date, status, decided_by)
                     VALUES (?, 2, 'Nhac nho chuyen can', 'Vang hoc nhieu buoi can theo doi them', 'nhac_nho', '2025-03-10', 'active', 1)`,
                    [row.student_id]
                );
            }
        }

        await connection.commit();
        console.log("Seeded realistic academic demo data successfully.");
        process.exit(0);
    } catch (error) {
        await connection.rollback();
        console.error("Failed to seed realistic academic demo data:", error.message);
        process.exit(1);
    } finally {
        connection.release();
    }
}

run();
