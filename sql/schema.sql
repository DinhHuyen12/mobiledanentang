-- =========================================================
-- Student Management System - Consolidated Schema
-- Generated to match the current backend models/routes.
-- Target: MySQL 8+
-- =========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS attendance_policies;
DROP TABLE IF EXISTS attendance_sessions;
DROP TABLE IF EXISTS student_documents;
DROP TABLE IF EXISTS tuition_payments;
DROP TABLE IF EXISTS tuitions;
DROP TABLE IF EXISTS academic_advisors;
DROP TABLE IF EXISTS disciplinary_actions;
DROP TABLE IF EXISTS student_scholarships;
DROP TABLE IF EXISTS scholarships;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS student_status_records;
DROP TABLE IF EXISTS graduation_requirements;
DROP TABLE IF EXISTS student_programs;
DROP TABLE IF EXISTS training_program_subjects;
DROP TABLE IF EXISTS training_programs;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS subject_prerequisites;
DROP TABLE IF EXISTS course_sections;
DROP TABLE IF EXISTS lecturer_info;
DROP TABLE IF EXISTS student_info;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS semesters;
DROP TABLE IF EXISTS academic_years;
DROP TABLE IF EXISTS faculties;
DROP TABLE IF EXISTS otp_codes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NULL,
    phone VARCHAR(20) NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE faculties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE academic_years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    academic_year_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_semesters_academic_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT uq_semesters_name_year UNIQUE (name, academic_year_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    faculty_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_classes_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_classes_academic_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT uq_classes_name_faculty_year UNIQUE (name, faculty_id, academic_year_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    credits INT NOT NULL,
    faculty_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_subjects_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE training_programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    total_credits_required INT NOT NULL DEFAULT 0,
    elective_credits_required INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_training_programs_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE training_program_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    subject_id INT NOT NULL,
    subject_type VARCHAR(20) NOT NULL DEFAULT 'required',
    recommended_semester INT NULL,
    display_order INT NOT NULL DEFAULT 1,
    total_hours INT NOT NULL DEFAULT 0,
    elearning VARCHAR(255) NULL,
    include_in_gpa TINYINT(1) NOT NULL DEFAULT 1,
    min_score_required DECIMAL(4,1) NOT NULL DEFAULT 5.0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_training_program_subjects_program
        FOREIGN KEY (program_id) REFERENCES training_programs(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_training_program_subjects_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT uq_training_program_subject UNIQUE (program_id, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE graduation_requirements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL UNIQUE,
    min_cumulative_gpa DECIMAL(4,2) NOT NULL DEFAULT 2.00,
    min_earned_credits INT NOT NULL DEFAULT 0,
    max_failed_subjects INT NOT NULL DEFAULT 0,
    required_english_level VARCHAR(100) NULL,
    required_it_level VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_graduation_requirements_program
        FOREIGN KEY (program_id) REFERENCES training_programs(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    class_id INT NOT NULL,
    enrollment_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_info_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_student_info_class
        FOREIGN KEY (class_id) REFERENCES classes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL DEFAULT 'hoso',
    title VARCHAR(255) NOT NULL,
    note VARCHAR(255) NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(150) NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_documents_student
        FOREIGN KEY (student_id) REFERENCES student_info(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_student_documents_uploaded_by
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    program_id INT NOT NULL,
    start_date DATE NOT NULL,
    expected_graduation_date DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_programs_student
        FOREIGN KEY (student_id) REFERENCES student_info(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_student_programs_program
        FOREIGN KEY (program_id) REFERENCES training_programs(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lecturer_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    lecturer_code VARCHAR(50) NOT NULL UNIQUE,
    academic_rank VARCHAR(100) NOT NULL,
    specialization VARCHAR(150) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lecturer_info_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_status_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    from_class_id INT NULL,
    to_class_id INT NULL,
    effective_date DATE NOT NULL,
    end_date DATE NULL,
    reason TEXT NULL,
    decision_no VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_status_records_student
        FOREIGN KEY (student_id) REFERENCES student_info(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_student_status_records_from_class
        FOREIGN KEY (from_class_id) REFERENCES classes(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_student_status_records_to_class
        FOREIGN KEY (to_class_id) REFERENCES classes(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_student_status_records_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    lecturer_id INT NOT NULL,
    semester_id INT NOT NULL,
    max_students INT NOT NULL DEFAULT 50,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_course_sections_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_course_sections_lecturer
        FOREIGN KEY (lecturer_id) REFERENCES lecturer_info(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_course_sections_semester
        FOREIGN KEY (semester_id) REFERENCES semesters(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_course_sections_max_students
        CHECK (max_students > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subject_prerequisites (
    subject_id INT NOT NULL,
    prerequisite_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (subject_id, prerequisite_id),
    CONSTRAINT fk_subject_prerequisites_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_subject_prerequisites_prerequisite
        FOREIGN KEY (prerequisite_id) REFERENCES subjects(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_section_id INT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedules_course_section
        FOREIGN KEY (course_section_id) REFERENCES course_sections(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT chk_schedules_time CHECK (start_time < end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_section_id INT NOT NULL,
    -- pending: sinh vien dang ky hoc lai/cai thien va cho admin duyet
    -- active: admin da xep/duyet sinh vien vao lop hoc phan
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_enrollments_student
        FOREIGN KEY (student_id) REFERENCES student_info(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_course_section
        FOREIGN KEY (course_section_id) REFERENCES course_sections(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL UNIQUE,
    attendance_score DECIMAL(4,1) NOT NULL,
    midterm_score DECIMAL(4,1) NOT NULL,
    final_score DECIMAL(4,1) NOT NULL,
    total_score DECIMAL(4,1) NOT NULL,
    letter_grade VARCHAR(2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_grades_enrollment
        FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT chk_grades_attendance_score
        CHECK (attendance_score >= 0 AND attendance_score <= 10),
    CONSTRAINT chk_grades_midterm_score
        CHECK (midterm_score >= 0 AND midterm_score <= 10),
    CONSTRAINT chk_grades_final_score
        CHECK (final_score >= 0 AND final_score <= 10),
    CONSTRAINT chk_grades_total_score
        CHECK (total_score >= 0 AND total_score <= 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tuitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    semester_id INT NOT NULL,
    total_credits INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
    due_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tuitions_student
        FOREIGN KEY (student_id) REFERENCES student_info(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_tuitions_semester
        FOREIGN KEY (semester_id) REFERENCES semesters(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT uq_tuitions_student_semester UNIQUE (student_id, semester_id),
    CONSTRAINT chk_tuitions_total_credits
        CHECK (total_credits > 0),
    CONSTRAINT chk_tuitions_amount
        CHECK (amount > 0),
    CONSTRAINT chk_tuitions_paid_amount
        CHECK (paid_amount >= 0 AND paid_amount <= amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE scholarships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    amount DECIMAL(12,2) NOT NULL,
    semester_id INT NULL,
    min_gpa DECIMAL(4,2) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_scholarships_semester
        FOREIGN KEY (semester_id) REFERENCES semesters(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT chk_scholarships_amount
        CHECK (amount > 0),
    CONSTRAINT chk_scholarships_min_gpa
        CHECK (min_gpa IS NULL OR (min_gpa >= 0 AND min_gpa <= 4))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_scholarships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scholarship_id INT NOT NULL,
    student_id INT NOT NULL,
    awarded_date DATE NOT NULL,
    note VARCHAR(255) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'approved',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_scholarships_scholarship
        FOREIGN KEY (scholarship_id) REFERENCES scholarships(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_student_scholarships_student
        FOREIGN KEY (student_id) REFERENCES student_info(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT uq_student_scholarships_unique
        UNIQUE (scholarship_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE disciplinary_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    semester_id INT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    level VARCHAR(50) NOT NULL,
    decision_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    decided_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_disciplinary_actions_student
        FOREIGN KEY (student_id) REFERENCES student_info(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_disciplinary_actions_semester
        FOREIGN KEY (semester_id) REFERENCES semesters(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_disciplinary_actions_decided_by
        FOREIGN KEY (decided_by) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE academic_advisors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lecturer_id INT NOT NULL,
    class_id INT NULL,
    student_id INT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    note VARCHAR(255) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_academic_advisors_lecturer
        FOREIGN KEY (lecturer_id) REFERENCES lecturer_info(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_academic_advisors_class
        FOREIGN KEY (class_id) REFERENCES classes(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_academic_advisors_student
        FOREIGN KEY (student_id) REFERENCES student_info(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tuition_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tuition_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NULL,
    note VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tuition_payments_tuition
        FOREIGN KEY (tuition_id) REFERENCES tuitions(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT chk_tuition_payments_amount
        CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_section_id INT NOT NULL,
    schedule_id INT NULL,
    session_date DATE NOT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    room VARCHAR(100) NULL,
    topic VARCHAR(255) NULL,
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    created_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_sessions_course_section
        FOREIGN KEY (course_section_id) REFERENCES course_sections(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_attendance_sessions_schedule
        FOREIGN KEY (schedule_id) REFERENCES schedules(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_attendance_sessions_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT uq_attendance_session_unique
        UNIQUE (course_section_id, session_date, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_session_id INT NOT NULL,
    enrollment_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
    check_in_time DATETIME NULL,
    note VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_records_session
        FOREIGN KEY (attendance_session_id) REFERENCES attendance_sessions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_attendance_records_enrollment
        FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_attendance_records_student
        FOREIGN KEY (student_id) REFERENCES student_info(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT uq_attendance_record_unique
        UNIQUE (attendance_session_id, enrollment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance_policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_section_id INT NOT NULL,
    present_weight DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    late_weight DECIMAL(5,2) NOT NULL DEFAULT 0.50,
    excused_weight DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    absent_weight DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    max_attendance_score DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_policies_course_section
        FOREIGN KEY (course_section_id) REFERENCES course_sections(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT uq_attendance_policy_course_section UNIQUE (course_section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_classes_faculty_id ON classes(faculty_id);
CREATE INDEX idx_classes_academic_year_id ON classes(academic_year_id);
CREATE INDEX idx_semesters_academic_year_id ON semesters(academic_year_id);
CREATE INDEX idx_training_programs_faculty_id ON training_programs(faculty_id);
CREATE INDEX idx_training_program_subjects_program_id ON training_program_subjects(program_id);
CREATE INDEX idx_training_program_subjects_subject_id ON training_program_subjects(subject_id);
CREATE INDEX idx_training_program_subjects_semester_order ON training_program_subjects(program_id, include_in_gpa, recommended_semester, display_order);
CREATE INDEX idx_graduation_requirements_program_id ON graduation_requirements(program_id);
CREATE INDEX idx_student_info_class_id ON student_info(class_id);
CREATE INDEX idx_student_documents_student_id ON student_documents(student_id);
CREATE INDEX idx_student_programs_student_id ON student_programs(student_id);
CREATE INDEX idx_student_programs_program_id ON student_programs(program_id);
CREATE INDEX idx_lecturer_info_user_id ON lecturer_info(user_id);
CREATE INDEX idx_student_status_records_student_id ON student_status_records(student_id);
CREATE INDEX idx_student_status_records_status ON student_status_records(status);
CREATE INDEX idx_course_sections_subject_id ON course_sections(subject_id);
CREATE INDEX idx_course_sections_lecturer_id ON course_sections(lecturer_id);
CREATE INDEX idx_course_sections_semester_id ON course_sections(semester_id);
CREATE INDEX idx_schedules_course_section_id ON schedules(course_section_id);
CREATE INDEX idx_schedules_day_time ON schedules(day_of_week, start_time, end_time);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_section_id ON enrollments(course_section_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_grades_total_score ON grades(total_score);
CREATE INDEX idx_otp_codes_email_type ON otp_codes(email, type);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX idx_tuitions_student_id ON tuitions(student_id);
CREATE INDEX idx_tuitions_semester_id ON tuitions(semester_id);
CREATE INDEX idx_tuitions_due_date ON tuitions(due_date);
CREATE INDEX idx_scholarships_semester_id ON scholarships(semester_id);
CREATE INDEX idx_student_scholarships_student_id ON student_scholarships(student_id);
CREATE INDEX idx_student_scholarships_scholarship_id ON student_scholarships(scholarship_id);
CREATE INDEX idx_disciplinary_actions_student_id ON disciplinary_actions(student_id);
CREATE INDEX idx_disciplinary_actions_semester_id ON disciplinary_actions(semester_id);
CREATE INDEX idx_academic_advisors_lecturer_id ON academic_advisors(lecturer_id);
CREATE INDEX idx_academic_advisors_class_id ON academic_advisors(class_id);
CREATE INDEX idx_academic_advisors_student_id ON academic_advisors(student_id);
CREATE INDEX idx_tuition_payments_tuition_id ON tuition_payments(tuition_id);
CREATE INDEX idx_tuition_payments_payment_date ON tuition_payments(payment_date);
CREATE INDEX idx_attendance_sessions_course_section ON attendance_sessions(course_section_id);
CREATE INDEX idx_attendance_sessions_schedule ON attendance_sessions(schedule_id);
CREATE INDEX idx_attendance_sessions_date ON attendance_sessions(session_date);
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_status ON attendance_records(status);

INSERT INTO roles (id, name) VALUES
    (1, 'admin'),
    (2, 'lecturer'),
    (3, 'student')
ON DUPLICATE KEY UPDATE
    name = VALUES(name);
