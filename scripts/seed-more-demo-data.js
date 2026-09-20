require("dotenv").config();

const db = require("../config/db");

const statements = [
    `UPDATE training_programs
     SET total_credits_required = 18, elective_credits_required = 6
     WHERE id = 1`,
    `UPDATE training_programs
     SET total_credits_required = 8, elective_credits_required = 0
     WHERE id = 2`,
    `UPDATE graduation_requirements
     SET min_earned_credits = 18
     WHERE program_id = 1`,
    `UPDATE graduation_requirements
     SET min_earned_credits = 8
     WHERE program_id = 2`,
    `UPDATE training_program_subjects
     SET min_score_required = 5.0
     WHERE min_score_required < 5.0`,

    `INSERT INTO users (id, username, email, password, full_name, phone, role_id)
     SELECT 9, 'gv.levanc', 'vanc.lecturer@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Le Van C', '0900000009', 2
     WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 9)`,
    `INSERT INTO users (id, username, email, password, full_name, phone, role_id)
     SELECT 10, 'sv.ngothig', 'thig.student@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Ngo Thi G', '0900000010', 3
     WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 10)`,
    `INSERT INTO users (id, username, email, password, full_name, phone, role_id)
     SELECT 11, 'sv.buithih', 'thih.student@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Bui Thi H', '0900000011', 3
     WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 11)`,
    `INSERT INTO users (id, username, email, password, full_name, phone, role_id)
     SELECT 12, 'sv.tranvani', 'vani.student@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Tran Van I', '0900000012', 3
     WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 12)`,

    `INSERT INTO lecturer_info (id, user_id, lecturer_code, academic_rank, specialization)
     SELECT 3, 9, 'GV003', 'Thac si', 'He thong thong tin'
     WHERE NOT EXISTS (SELECT 1 FROM lecturer_info WHERE id = 3)`,
    `INSERT INTO student_info (id, user_id, class_id, enrollment_date, status)
     SELECT 6, 10, 1, '2024-09-01', 'active'
     WHERE NOT EXISTS (SELECT 1 FROM student_info WHERE id = 6)`,
    `INSERT INTO student_info (id, user_id, class_id, enrollment_date, status)
     SELECT 7, 11, 2, '2024-09-01', 'active'
     WHERE NOT EXISTS (SELECT 1 FROM student_info WHERE id = 7)`,
    `INSERT INTO student_info (id, user_id, class_id, enrollment_date, status)
     SELECT 8, 12, 3, '2024-09-01', 'active'
     WHERE NOT EXISTS (SELECT 1 FROM student_info WHERE id = 8)`,

    `INSERT INTO subjects (id, subject_code, name, credits, faculty_id)
     SELECT 8, 'IT303', 'Mang may tinh', 3, 1
     WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE id = 8)`,
    `INSERT INTO subjects (id, subject_code, name, credits, faculty_id)
     SELECT 9, 'IT304', 'An toan thong tin', 3, 1
     WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE id = 9)`,
    `INSERT INTO subjects (id, subject_code, name, credits, faculty_id)
     SELECT 10, 'BUS102', 'Marketing can ban', 2, 2
     WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE id = 10)`,
    `INSERT INTO subjects (id, subject_code, name, credits, faculty_id)
     SELECT 11, 'BUS201', 'Quan tri nhan su', 2, 2
     WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE id = 11)`,
    `INSERT INTO subjects (id, subject_code, name, credits, faculty_id)
     SELECT 12, 'BUS202', 'Tai chinh doanh nghiep', 2, 2
     WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE id = 12)`,

    `INSERT INTO training_program_subjects (id, program_id, subject_id, subject_type, recommended_semester, min_score_required)
     SELECT 8, 1, 8, 'elective', 4, 5.0
     WHERE NOT EXISTS (SELECT 1 FROM training_program_subjects WHERE id = 8)`,
    `INSERT INTO training_program_subjects (id, program_id, subject_id, subject_type, recommended_semester, min_score_required)
     SELECT 9, 1, 9, 'elective', 4, 5.0
     WHERE NOT EXISTS (SELECT 1 FROM training_program_subjects WHERE id = 9)`,
    `INSERT INTO training_program_subjects (id, program_id, subject_id, subject_type, recommended_semester, min_score_required)
     SELECT 10, 2, 10, 'required', 1, 5.0
     WHERE NOT EXISTS (SELECT 1 FROM training_program_subjects WHERE id = 10)`,
    `INSERT INTO training_program_subjects (id, program_id, subject_id, subject_type, recommended_semester, min_score_required)
     SELECT 11, 2, 11, 'required', 2, 5.0
     WHERE NOT EXISTS (SELECT 1 FROM training_program_subjects WHERE id = 11)`,
    `INSERT INTO training_program_subjects (id, program_id, subject_id, subject_type, recommended_semester, min_score_required)
     SELECT 12, 2, 12, 'required', 2, 5.0
     WHERE NOT EXISTS (SELECT 1 FROM training_program_subjects WHERE id = 12)`,

    `INSERT INTO student_programs (id, student_id, program_id, start_date, expected_graduation_date, status)
     SELECT 6, 6, 1, '2024-09-01', '2028-06-30', 'active'
     WHERE NOT EXISTS (SELECT 1 FROM student_programs WHERE id = 6)`,
    `INSERT INTO student_programs (id, student_id, program_id, start_date, expected_graduation_date, status)
     SELECT 7, 7, 1, '2024-09-01', '2028-06-30', 'active'
     WHERE NOT EXISTS (SELECT 1 FROM student_programs WHERE id = 7)`,
    `INSERT INTO student_programs (id, student_id, program_id, start_date, expected_graduation_date, status)
     SELECT 8, 8, 2, '2024-09-01', '2028-06-30', 'active'
     WHERE NOT EXISTS (SELECT 1 FROM student_programs WHERE id = 8)`,

    `INSERT INTO scholarships (id, name, description, amount, semester_id, min_gpa, status)
     SELECT 3, 'Hoc bong nghien cuu khoa hoc', 'Khuyen khich sinh vien tham gia nghien cuu', 3500000.00, 4, 3.00, 'active'
     WHERE NOT EXISTS (SELECT 1 FROM scholarships WHERE id = 3)`,
    `INSERT INTO student_scholarships (id, scholarship_id, student_id, awarded_date, note, status)
     SELECT 3, 3, 6, '2025-03-20', 'Tham gia de tai khoa hoc cap khoa', 'approved'
     WHERE NOT EXISTS (SELECT 1 FROM student_scholarships WHERE id = 3)`,
    `INSERT INTO disciplinary_actions (id, student_id, semester_id, title, description, level, decision_date, status, decided_by)
     SELECT 3, 7, 1, 'Nhac nho tac phong', 'Vi pham noi quy dong phuc', 'nhac_nho', '2024-11-12', 'active', 1
     WHERE NOT EXISTS (SELECT 1 FROM disciplinary_actions WHERE id = 3)`,
    `INSERT INTO academic_advisors (id, lecturer_id, class_id, student_id, start_date, end_date, note, status)
     SELECT 4, 3, 3, NULL, '2024-09-01', NULL, 'Co van hoc tap lop QTKD K24', 'active'
     WHERE NOT EXISTS (SELECT 1 FROM academic_advisors WHERE id = 4)`,

    `INSERT INTO course_sections (id, subject_id, lecturer_id, semester_id, max_students)
     SELECT 8, 8, 3, 4, 40
     WHERE NOT EXISTS (SELECT 1 FROM course_sections WHERE id = 8)`,
    `INSERT INTO course_sections (id, subject_id, lecturer_id, semester_id, max_students)
     SELECT 9, 9, 3, 5, 40
     WHERE NOT EXISTS (SELECT 1 FROM course_sections WHERE id = 9)`,
    `INSERT INTO course_sections (id, subject_id, lecturer_id, semester_id, max_students)
     SELECT 10, 10, 2, 1, 60
     WHERE NOT EXISTS (SELECT 1 FROM course_sections WHERE id = 10)`,
    `INSERT INTO course_sections (id, subject_id, lecturer_id, semester_id, max_students)
     SELECT 11, 11, 2, 2, 55
     WHERE NOT EXISTS (SELECT 1 FROM course_sections WHERE id = 11)`,
    `INSERT INTO course_sections (id, subject_id, lecturer_id, semester_id, max_students)
     SELECT 12, 12, 3, 2, 55
     WHERE NOT EXISTS (SELECT 1 FROM course_sections WHERE id = 12)`,

    `INSERT INTO schedules (id, course_section_id, day_of_week, start_time, end_time, room)
     SELECT 10, 8, 'Thu 2', '09:15:00', '11:15:00', 'Lab02'
     WHERE NOT EXISTS (SELECT 1 FROM schedules WHERE id = 10)`,
    `INSERT INTO schedules (id, course_section_id, day_of_week, start_time, end_time, room)
     SELECT 11, 9, 'Thu 5', '13:00:00', '15:00:00', 'Lab03'
     WHERE NOT EXISTS (SELECT 1 FROM schedules WHERE id = 11)`,
    `INSERT INTO schedules (id, course_section_id, day_of_week, start_time, end_time, room)
     SELECT 12, 10, 'Thu 3', '07:00:00', '09:00:00', 'B101'
     WHERE NOT EXISTS (SELECT 1 FROM schedules WHERE id = 12)`,
    `INSERT INTO schedules (id, course_section_id, day_of_week, start_time, end_time, room)
     SELECT 13, 11, 'Thu 4', '09:15:00', '11:15:00', 'B102'
     WHERE NOT EXISTS (SELECT 1 FROM schedules WHERE id = 13)`,
    `INSERT INTO schedules (id, course_section_id, day_of_week, start_time, end_time, room)
     SELECT 14, 12, 'Thu 6', '13:00:00', '15:00:00', 'B103'
     WHERE NOT EXISTS (SELECT 1 FROM schedules WHERE id = 14)`,

    `INSERT INTO enrollments (id, student_id, course_section_id, status)
     SELECT 15, 6, 1, 'completed'
     WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE id = 15)`,
    `INSERT INTO enrollments (id, student_id, course_section_id, status)
     SELECT 16, 7, 2, 'completed'
     WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE id = 16)`,
    `INSERT INTO enrollments (id, student_id, course_section_id, status)
     SELECT 17, 6, 3, 'active'
     WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE id = 17)`,
    `INSERT INTO enrollments (id, student_id, course_section_id, status)
     SELECT 18, 7, 4, 'active'
     WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE id = 18)`,
    `INSERT INTO enrollments (id, student_id, course_section_id, status)
     SELECT 19, 6, 8, 'active'
     WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE id = 19)`,
    `INSERT INTO enrollments (id, student_id, course_section_id, status)
     SELECT 20, 7, 9, 'active'
     WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE id = 20)`,
    `INSERT INTO enrollments (id, student_id, course_section_id, status)
     SELECT 21, 5, 10, 'completed'
     WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE id = 21)`,
    `INSERT INTO enrollments (id, student_id, course_section_id, status)
     SELECT 22, 8, 10, 'completed'
     WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE id = 22)`,
    `INSERT INTO enrollments (id, student_id, course_section_id, status)
     SELECT 23, 5, 11, 'active'
     WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE id = 23)`,
    `INSERT INTO enrollments (id, student_id, course_section_id, status)
     SELECT 24, 8, 12, 'active'
     WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE id = 24)`,

    `INSERT INTO grades (id, enrollment_id, attendance_score, midterm_score, final_score, total_score, letter_grade)
     SELECT 9, 15, 8.0, 7.5, 7.0, 7.4, 'B'
     WHERE NOT EXISTS (SELECT 1 FROM grades WHERE id = 9)`,
    `INSERT INTO grades (id, enrollment_id, attendance_score, midterm_score, final_score, total_score, letter_grade)
     SELECT 10, 16, 6.5, 6.0, 5.5, 5.9, 'C'
     WHERE NOT EXISTS (SELECT 1 FROM grades WHERE id = 10)`,
    `INSERT INTO grades (id, enrollment_id, attendance_score, midterm_score, final_score, total_score, letter_grade)
     SELECT 11, 21, 8.0, 8.0, 7.5, 7.8, 'B'
     WHERE NOT EXISTS (SELECT 1 FROM grades WHERE id = 11)`,
    `INSERT INTO grades (id, enrollment_id, attendance_score, midterm_score, final_score, total_score, letter_grade)
     SELECT 12, 22, 5.5, 5.0, 5.0, 5.1, 'D+'
     WHERE NOT EXISTS (SELECT 1 FROM grades WHERE id = 12)`,

    `INSERT INTO tuitions (id, student_id, semester_id, total_credits, amount, paid_amount, status, due_date)
     SELECT 7, 6, 1, 6, 4500000.00, 4500000.00, 'paid', '2024-10-15'
     WHERE NOT EXISTS (SELECT 1 FROM tuitions WHERE id = 7)`,
    `INSERT INTO tuitions (id, student_id, semester_id, total_credits, amount, paid_amount, status, due_date)
     SELECT 8, 7, 1, 6, 4500000.00, 2500000.00, 'partial', '2024-10-15'
     WHERE NOT EXISTS (SELECT 1 FROM tuitions WHERE id = 8)`,
    `INSERT INTO tuitions (id, student_id, semester_id, total_credits, amount, paid_amount, status, due_date)
     SELECT 9, 8, 1, 4, 3000000.00, 0.00, 'unpaid', '2024-10-20'
     WHERE NOT EXISTS (SELECT 1 FROM tuitions WHERE id = 9)`,
    `INSERT INTO tuition_payments (id, tuition_id, payment_date, amount, payment_method, note)
     SELECT 5, 7, '2024-09-18', 4500000.00, 'bank', 'Thanh toan day du'
     WHERE NOT EXISTS (SELECT 1 FROM tuition_payments WHERE id = 5)`,
    `INSERT INTO tuition_payments (id, tuition_id, payment_date, amount, payment_method, note)
     SELECT 6, 8, '2024-09-28', 2500000.00, 'cash', 'Dong mot phan hoc phi'
     WHERE NOT EXISTS (SELECT 1 FROM tuition_payments WHERE id = 6)`,

    `INSERT INTO attendance_sessions (id, course_section_id, schedule_id, session_date, start_time, end_time, room, topic, status, created_by)
     SELECT 5, 8, 10, '2025-02-20', '09:15:00', '11:15:00', 'Lab02', 'Mo hinh OSI', 'closed', 9
     WHERE NOT EXISTS (SELECT 1 FROM attendance_sessions WHERE id = 5)`,
    `INSERT INTO attendance_sessions (id, course_section_id, schedule_id, session_date, start_time, end_time, room, topic, status, created_by)
     SELECT 6, 10, 12, '2024-09-18', '07:00:00', '09:00:00', 'B101', 'Gioi thieu marketing', 'closed', 3
     WHERE NOT EXISTS (SELECT 1 FROM attendance_sessions WHERE id = 6)`,
    `INSERT INTO attendance_records (id, attendance_session_id, enrollment_id, student_id, status, check_in_time, note)
     SELECT 9, 5, 19, 6, 'present', '2025-02-20 09:10:00', NULL
     WHERE NOT EXISTS (SELECT 1 FROM attendance_records WHERE id = 9)`,
    `INSERT INTO attendance_records (id, attendance_session_id, enrollment_id, student_id, status, check_in_time, note)
     SELECT 10, 6, 21, 5, 'present', '2024-09-18 06:58:00', NULL
     WHERE NOT EXISTS (SELECT 1 FROM attendance_records WHERE id = 10)`,
    `INSERT INTO attendance_records (id, attendance_session_id, enrollment_id, student_id, status, check_in_time, note)
     SELECT 11, 6, 22, 8, 'late', '2024-09-18 07:12:00', 'Den muon 12 phut'
     WHERE NOT EXISTS (SELECT 1 FROM attendance_records WHERE id = 11)`
];

async function run() {
    for (const statement of statements) {
        await db.query(statement);
    }

    console.log("Seeded more demo data successfully.");
    process.exit(0);
}

run().catch((error) => {
    console.error("Failed to seed more demo data:", error.message);
    process.exit(1);
});
