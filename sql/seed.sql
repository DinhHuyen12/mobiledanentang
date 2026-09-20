-- =========================================================
-- Student Management System - Demo Seed Data
-- Usage:
--   1. Import sql/schema.sql
--   2. Import sql/seed.sql
-- Demo password for all seeded users: 123456
-- =========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE attendance_records;
TRUNCATE TABLE attendance_policies;
TRUNCATE TABLE attendance_sessions;
TRUNCATE TABLE tuition_payments;
TRUNCATE TABLE tuitions;
TRUNCATE TABLE academic_advisors;
TRUNCATE TABLE disciplinary_actions;
TRUNCATE TABLE student_scholarships;
TRUNCATE TABLE scholarships;
TRUNCATE TABLE grades;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE student_status_records;
TRUNCATE TABLE graduation_requirements;
TRUNCATE TABLE student_programs;
TRUNCATE TABLE training_program_subjects;
TRUNCATE TABLE training_programs;
TRUNCATE TABLE schedules;
TRUNCATE TABLE subject_prerequisites;
TRUNCATE TABLE course_sections;
TRUNCATE TABLE lecturer_info;
TRUNCATE TABLE student_info;
TRUNCATE TABLE subjects;
TRUNCATE TABLE classes;
TRUNCATE TABLE semesters;
TRUNCATE TABLE academic_years;
TRUNCATE TABLE faculties;
TRUNCATE TABLE otp_codes;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO roles (id, name) VALUES
    (1, 'admin'),
    (2, 'lecturer'),
    (3, 'student');

INSERT INTO faculties (id, name) VALUES
    (1, 'Công nghệ thông tin'),
    (2, 'Kinh tế'),
    (3, 'Điện - Điện tử');

INSERT INTO academic_years (id, name) VALUES
    (1, '2024-2025'),
    (2, '2025-2026');

INSERT INTO semesters (id, name, academic_year_id) VALUES
    (1, 'Hoc ky 1', 1),
    (2, 'Hoc ky 2', 1),
    (3, 'Hoc ky he', 1),
    (4, 'Hoc ky 1', 2),
    (5, 'Hoc ky 2', 2);

INSERT INTO classes (id, name, faculty_id, academic_year_id) VALUES
    (1, 'CNTT K24A', 1, 1),
    (2, 'CNTT K24B', 1, 1),
    (3, 'QTKD K24', 2, 1);

INSERT INTO users (id, username, email, password, full_name, phone, role_id) VALUES
    (1, 'admin', 'admin@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Quan tri he thong', '0900000001', 1),
    (2, 'gv.nguyenvana', 'vana.lecturer@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Nguyen Van A', '0900000002', 2),
    (3, 'gv.tranthib', 'thib.lecturer@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Tran Thi B', '0900000003', 2),
    (4, 'sv.nguyenvanc', 'vanc.student@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Nguyen Van C', '0900000004', 3),
    (5, 'sv.lethid', 'thid.student@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Le Thi D', '0900000005', 3),
    (6, 'sv.phamvane', 'vane.student@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Pham Van E', '0900000006', 3),
    (7, 'sv.hoangthif', 'thif.student@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Hoang Thi F', '0900000007', 3),
    (8, 'sv.doanvanh', 'vanh.student@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Doan Van H', '0900000008', 3),
    (9, 'gv.levanc', 'vanc.lecturer@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Le Van C', '0900000009', 2),
    (10, 'sv.ngothig', 'thig.student@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Ngo Thi G', '0900000010', 3),
    (11, 'sv.buithih', 'thih.student@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Bui Thi H', '0900000011', 3),
    (12, 'sv.tranvani', 'vani.student@university.local', '$2b$10$hKfDNqp1COGfVzkm7Mptj.Kxctd8fstfNs0dmdK.x5QniQ7FNOJzS', 'Tran Van I', '0900000012', 3);

INSERT INTO lecturer_info (id, user_id, lecturer_code, academic_rank, specialization) VALUES
    (1, 2, 'GV001', 'Thac si', 'Lap trinh va Co so du lieu'),
    (2, 3, 'GV002', 'Tien si', 'Cong nghe phan mem'),
    (3, 9, 'GV003', 'Thac si', 'He thong thong tin');

INSERT INTO student_info (id, user_id, class_id, enrollment_date, status) VALUES
    (1, 4, 1, '2024-09-01', 'active'),
    (2, 5, 1, '2024-09-01', 'active'),
    (3, 6, 2, '2024-09-01', 'active'),
    (4, 7, 2, '2024-09-01', 'active'),
    (5, 8, 3, '2024-09-01', 'active'),
    (6, 10, 1, '2024-09-01', 'active'),
    (7, 11, 2, '2024-09-01', 'active'),
    (8, 12, 3, '2024-09-01', 'active');

INSERT INTO subjects (id, subject_code, name, credits, faculty_id) VALUES
    (1, 'IT101', 'Nhap mon lap trinh', 3, 1),
    (2, 'IT102', 'Lap trinh C', 3, 1),
    (3, 'IT201', 'Cau truc du lieu', 3, 1),
    (4, 'IT202', 'Co so du lieu', 3, 1),
    (5, 'IT301', 'Phan tich thiet ke he thong', 3, 1),
    (6, 'IT302', 'Lap trinh Web', 3, 1),
    (7, 'BUS101', 'Nguyen ly ke toan', 2, 2),
    (8, 'IT303', 'Mang may tinh', 3, 1),
    (9, 'IT304', 'An toan thong tin', 3, 1),
    (10, 'BUS102', 'Marketing can ban', 2, 2),
    (11, 'BUS201', 'Quan tri nhan su', 2, 2),
    (12, 'BUS202', 'Tai chinh doanh nghiep', 2, 2);

INSERT INTO training_programs (id, faculty_id, code, name, total_credits_required, elective_credits_required, status, description) VALUES
    (1, 1, 'CNTT-2024', 'Chương trình đào tạo Công nghệ thông tin K24', 18, 6, 'active', 'Áp dụng cho sinh viên CNTT khóa 2024'),
    (2, 2, 'QTKD-2024', 'Chương trình đào tạo Quản trị kinh doanh K24', 8, 0, 'active', 'Áp dụng cho sinh viên QTKD khóa 2024');

INSERT INTO training_program_subjects (id, program_id, subject_id, subject_type, recommended_semester, min_score_required) VALUES
    (1, 1, 1, 'required', 1, 5.0),
    (2, 1, 2, 'required', 1, 5.0),
    (3, 1, 3, 'required', 2, 5.0),
    (4, 1, 4, 'required', 2, 5.0),
    (5, 1, 5, 'elective', 3, 5.0),
    (6, 1, 6, 'elective', 3, 5.0),
    (7, 2, 7, 'required', 1, 5.0),
    (8, 1, 8, 'elective', 4, 5.0),
    (9, 1, 9, 'elective', 4, 5.0),
    (10, 2, 10, 'required', 1, 5.0),
    (11, 2, 11, 'required', 2, 5.0),
    (12, 2, 12, 'required', 2, 5.0);

INSERT INTO graduation_requirements (id, program_id, min_cumulative_gpa, min_earned_credits, max_failed_subjects, required_english_level, required_it_level, status) VALUES
    (1, 1, 2.00, 18, 0, 'B1', 'Co ban', 'active'),
    (2, 2, 2.00, 8, 0, NULL, NULL, 'active');

INSERT INTO student_programs (id, student_id, program_id, start_date, expected_graduation_date, status) VALUES
    (1, 1, 1, '2024-09-01', '2028-06-30', 'active'),
    (2, 2, 1, '2024-09-01', '2028-06-30', 'active'),
    (3, 3, 1, '2024-09-01', '2028-06-30', 'active'),
    (4, 4, 1, '2024-09-01', '2028-06-30', 'active'),
    (5, 5, 2, '2024-09-01', '2028-06-30', 'active'),
    (6, 6, 1, '2024-09-01', '2028-06-30', 'active'),
    (7, 7, 1, '2024-09-01', '2028-06-30', 'active'),
    (8, 8, 2, '2024-09-01', '2028-06-30', 'active');

INSERT INTO subject_prerequisites (subject_id, prerequisite_id) VALUES
    (2, 1),
    (3, 2),
    (4, 2),
    (5, 4),
    (6, 2);

INSERT INTO course_sections (id, subject_id, lecturer_id, semester_id, max_students) VALUES
    (1, 1, 1, 1, 50),
    (2, 2, 1, 1, 50),
    (3, 3, 2, 2, 40),
    (4, 4, 2, 2, 45),
    (5, 5, 2, 4, 35),
    (6, 6, 1, 4, 45),
    (7, 7, 2, 1, 60),
    (8, 8, 3, 4, 40),
    (9, 9, 3, 5, 40),
    (10, 10, 2, 1, 60),
    (11, 11, 2, 2, 55),
    (12, 12, 3, 2, 55);

INSERT INTO schedules (id, course_section_id, day_of_week, start_time, end_time, room) VALUES
    (1, 1, 'Thu 2', '07:00:00', '09:00:00', 'A101'),
    (2, 1, 'Thu 4', '07:00:00', '09:00:00', 'A101'),
    (3, 2, 'Thu 3', '09:15:00', '11:15:00', 'A102'),
    (4, 2, 'Thu 5', '09:15:00', '11:15:00', 'A102'),
    (5, 3, 'Thu 2', '13:00:00', '15:00:00', 'B201'),
    (6, 4, 'Thu 3', '13:00:00', '15:00:00', 'B202'),
    (7, 5, 'Thu 4', '13:00:00', '15:00:00', 'C301'),
    (8, 6, 'Thu 6', '07:00:00', '09:00:00', 'Lab01'),
    (9, 7, 'Thu 7', '07:00:00', '09:00:00', 'D101'),
    (10, 8, 'Thu 2', '09:15:00', '11:15:00', 'Lab02'),
    (11, 9, 'Thu 5', '13:00:00', '15:00:00', 'Lab03'),
    (12, 10, 'Thu 3', '07:00:00', '09:00:00', 'B101'),
    (13, 11, 'Thu 4', '09:15:00', '11:15:00', 'B102'),
    (14, 12, 'Thu 6', '13:00:00', '15:00:00', 'B103');

INSERT INTO enrollments (id, student_id, course_section_id, status) VALUES
    (1, 1, 1, 'completed'),
    (2, 2, 1, 'completed'),
    (3, 3, 1, 'completed'),
    (4, 4, 1, 'completed'),
    (5, 1, 2, 'completed'),
    (6, 2, 2, 'completed'),
    (7, 3, 2, 'completed'),
    (8, 4, 2, 'completed'),
    (9, 1, 3, 'active'),
    (10, 2, 3, 'active'),
    (11, 3, 4, 'active'),
    (12, 4, 4, 'active'),
    (13, 5, 7, 'active'),
    (14, 1, 6, 'active'),
    (15, 6, 1, 'completed'),
    (16, 7, 2, 'completed'),
    (17, 6, 3, 'active'),
    (18, 7, 4, 'active'),
    (19, 6, 8, 'active'),
    (20, 7, 9, 'active'),
    (21, 5, 10, 'completed'),
    (22, 8, 10, 'completed'),
    (23, 5, 11, 'active'),
    (24, 8, 12, 'active');

INSERT INTO grades (id, enrollment_id, attendance_score, midterm_score, final_score, total_score, letter_grade) VALUES
    (1, 1, 8.0, 7.5, 8.0, 7.9, 'B'),
    (2, 2, 7.0, 6.5, 5.5, 6.1, 'C+'),
    (3, 3, 9.0, 8.5, 9.0, 8.9, 'A'),
    (4, 4, 6.0, 5.5, 4.0, 4.9, 'D'),
    (5, 5, 8.5, 8.0, 8.5, 8.4, 'B+'),
    (6, 6, 5.5, 5.0, 4.5, 4.9, 'D'),
    (7, 7, 7.5, 7.0, 8.0, 7.6, 'B'),
    (8, 8, 3.0, 3.5, 3.0, 3.1, 'F'),
    (9, 15, 8.0, 7.5, 7.0, 7.4, 'B'),
    (10, 16, 6.5, 6.0, 5.5, 5.9, 'C'),
    (11, 21, 8.0, 8.0, 7.5, 7.8, 'B'),
    (12, 22, 5.5, 5.0, 5.0, 5.1, 'D+');

INSERT INTO tuitions (id, student_id, semester_id, total_credits, amount, paid_amount, status, due_date) VALUES
    (1, 1, 1, 6, 4500000.00, 4500000.00, 'paid', '2024-10-15'),
    (2, 2, 1, 6, 4500000.00, 2000000.00, 'partial', '2024-10-15'),
    (3, 3, 1, 6, 4500000.00, 0.00, 'unpaid', '2024-10-15'),
    (4, 4, 1, 6, 4500000.00, 4500000.00, 'paid', '2024-10-15'),
    (5, 5, 1, 2, 1800000.00, 0.00, 'unpaid', '2024-10-20'),
    (6, 1, 2, 6, 4800000.00, 1500000.00, 'partial', '2025-03-15'),
    (7, 6, 1, 6, 4500000.00, 4500000.00, 'paid', '2024-10-15'),
    (8, 7, 1, 6, 4500000.00, 2500000.00, 'partial', '2024-10-15'),
    (9, 8, 1, 4, 3000000.00, 0.00, 'unpaid', '2024-10-20');

INSERT INTO tuition_payments (id, tuition_id, payment_date, amount, payment_method, note) VALUES
    (1, 1, '2024-09-20', 4500000.00, 'bank', 'Thanh toan hoc phi HK1 day du'),
    (2, 2, '2024-09-22', 2000000.00, 'cash', 'Dong dot 1'),
    (3, 4, '2024-09-25', 4500000.00, 'vnpay', 'VNPAY_TXN_REF:DEMO0004'),
    (4, 6, '2025-02-20', 1500000.00, 'bank', 'Dong dot 1 HK2'),
    (5, 7, '2024-09-18', 4500000.00, 'bank', 'Thanh toan day du'),
    (6, 8, '2024-09-28', 2500000.00, 'cash', 'Dong mot phan hoc phi');

INSERT INTO student_status_records (id, student_id, record_type, from_class_id, to_class_id, effective_date, end_date, reason, decision_no, status, approved_by) VALUES
    (1, 2, 'bao_luu', 1, NULL, '2025-01-15', '2025-08-15', 'Bao luu vi ly do ca nhan', 'QD-BL-001', 'approved', 1),
    (2, 3, 'chuyen_lop', 2, 1, '2025-02-01', NULL, 'Chuyen sang lop phu hop lich hoc', 'QD-CL-002', 'pending', NULL),
    (3, 5, 'nghi_hoc', 3, NULL, '2025-03-01', NULL, 'Tam nghi de giai quyet cong viec gia dinh', 'QD-NH-003', 'pending', NULL),
    (4, 7, 'bao_luu', 2, NULL, '2025-02-15', '2025-07-15', 'Tam dung vi suc khoe', 'QD-BL-004', 'approved', 1);

INSERT INTO scholarships (id, name, description, amount, semester_id, min_gpa, status) VALUES
    (1, 'Hoc bong khuyen khich hoc tap', 'Hoc bong danh cho sinh vien co ket qua hoc tap tot', 3000000.00, 1, 3.20, 'active'),
    (2, 'Hoc bong vuot kho', 'Ho tro sinh vien co hoan canh kho khan', 2000000.00, 2, 2.50, 'active'),
    (3, 'Hoc bong nghien cuu khoa hoc', 'Khuyen khich sinh vien tham gia nghien cuu', 3500000.00, 4, 3.00, 'active');

INSERT INTO student_scholarships (id, scholarship_id, student_id, awarded_date, note, status) VALUES
    (1, 1, 1, '2025-01-10', 'Dat GPA hoc ky 1 loai gioi', 'approved'),
    (2, 2, 2, '2025-02-15', 'Ho tro hoc phi hoc ky 2', 'approved'),
    (3, 3, 6, '2025-03-20', 'Tham gia de tai khoa hoc cap khoa', 'approved');

INSERT INTO disciplinary_actions (id, student_id, semester_id, title, description, level, decision_date, status, decided_by) VALUES
    (1, 4, 1, 'Nhac nho di hoc muon', 'Sinh vien di hoc muon nhieu lan trong thang 10', 'nhac_nho', '2024-10-30', 'active', 1),
    (2, 2, 2, 'Canh cao hoc vu', 'Vang hoc khong phep qua so buoi quy dinh', 'canh_cao', '2025-02-28', 'active', 1),
    (3, 7, 1, 'Nhac nho tac phong', 'Vi pham noi quy dong phuc', 'nhac_nho', '2024-11-12', 'active', 1);

INSERT INTO academic_advisors (id, lecturer_id, class_id, student_id, start_date, end_date, note, status) VALUES
    (1, 1, 1, NULL, '2024-09-01', NULL, 'Co van hoc tap lop CNTT K24A', 'active'),
    (2, 2, 2, NULL, '2024-09-01', NULL, 'Co van hoc tap lop CNTT K24B', 'active'),
    (3, 2, NULL, 5, '2024-09-01', NULL, 'Co van hoc tap rieng cho sinh vien QTKD K24', 'active'),
    (4, 3, 3, NULL, '2024-09-01', NULL, 'Co van hoc tap lop QTKD K24', 'active');

INSERT INTO attendance_sessions (id, course_section_id, schedule_id, session_date, start_time, end_time, room, topic, status, created_by) VALUES
    (1, 2, 3, '2024-09-10', '09:15:00', '11:15:00', 'A102', 'Bien, ham va nhap xuat', 'closed', 2),
    (2, 2, 4, '2024-09-12', '09:15:00', '11:15:00', 'A102', 'Mang 1 chieu', 'closed', 2),
    (3, 3, 5, '2025-01-10', '13:00:00', '15:00:00', 'B201', 'Gioi thieu danh sach lien ket', 'open', 3),
    (4, 4, 6, '2025-01-11', '13:00:00', '15:00:00', 'B202', 'Mo dau he quan tri co so du lieu', 'open', 3),
    (5, 8, 10, '2025-02-20', '09:15:00', '11:15:00', 'Lab02', 'Mo hinh OSI', 'closed', 9),
    (6, 10, 12, '2024-09-18', '07:00:00', '09:00:00', 'B101', 'Gioi thieu marketing', 'closed', 3);

INSERT INTO attendance_records (id, attendance_session_id, enrollment_id, student_id, status, check_in_time, note) VALUES
    (1, 1, 5, 1, 'present', '2024-09-10 09:10:00', 'Di hoc day du'),
    (2, 1, 6, 2, 'late', '2024-09-10 09:25:00', 'Den muon 10 phut'),
    (3, 1, 7, 3, 'present', '2024-09-10 09:05:00', NULL),
    (4, 1, 8, 4, 'absent', NULL, 'Vang khong phep'),
    (5, 2, 5, 1, 'present', '2024-09-12 09:12:00', NULL),
    (6, 2, 6, 2, 'excused', NULL, 'Xin nghi co phep'),
    (7, 2, 7, 3, 'present', '2024-09-12 09:08:00', NULL),
    (8, 2, 8, 4, 'present', '2024-09-12 09:09:00', NULL),
    (9, 5, 19, 6, 'present', '2025-02-20 09:10:00', NULL),
    (10, 6, 21, 5, 'present', '2024-09-18 06:58:00', NULL),
    (11, 6, 22, 8, 'late', '2024-09-18 07:12:00', 'Den muon 12 phut');

INSERT INTO attendance_policies (id, course_section_id, present_weight, late_weight, excused_weight, absent_weight, max_attendance_score) VALUES
    (1, 2, 1.00, 0.50, 1.00, 0.00, 10.00),
    (2, 3, 1.00, 0.50, 1.00, 0.00, 10.00),
    (3, 4, 1.00, 0.50, 1.00, 0.00, 10.00);

INSERT INTO otp_codes (id, email, otp, type, expires_at, used_at) VALUES
    (1, 'vanc.student@university.local', '123456', 'register', DATE_ADD(NOW(), INTERVAL 5 MINUTE), NULL),
    (2, 'admin@university.local', '654321', 'login', DATE_ADD(NOW(), INTERVAL 5 MINUTE), NULL);
