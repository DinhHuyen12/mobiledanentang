CREATE TABLE IF NOT EXISTS attendance_sessions (
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
);

CREATE TABLE IF NOT EXISTS attendance_records (
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
);

CREATE TABLE IF NOT EXISTS attendance_policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_section_id INT NOT NULL,
    present_weight DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    late_weight DECIMAL(5,2) NOT NULL DEFAULT 0.50,
    excused_weight DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    absent_weight DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    max_attendance_score DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_attendance_policies_course_section
        FOREIGN KEY (course_section_id) REFERENCES course_sections(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_attendance_policy_course_section
        UNIQUE (course_section_id)
);

CREATE INDEX idx_attendance_sessions_course_section
    ON attendance_sessions(course_section_id);

CREATE INDEX idx_attendance_sessions_schedule
    ON attendance_sessions(schedule_id);

CREATE INDEX idx_attendance_sessions_date
    ON attendance_sessions(session_date);

CREATE INDEX idx_attendance_records_student
    ON attendance_records(student_id);

CREATE INDEX idx_attendance_records_status
    ON attendance_records(status);
