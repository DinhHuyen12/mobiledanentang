require("dotenv").config({ quiet: true });

const db = require("../config/db");

const createStatements = [
    `CREATE TABLE IF NOT EXISTS enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_section_id INT NOT NULL,
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    "CREATE INDEX idx_enrollments_student_id ON enrollments(student_id)",
    "CREATE INDEX idx_enrollments_course_section_id ON enrollments(course_section_id)",
    "CREATE INDEX idx_enrollments_status ON enrollments(status)",

    `CREATE TABLE IF NOT EXISTS grades (
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
            ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    "CREATE INDEX idx_grades_total_score ON grades(total_score)",

    `CREATE TABLE IF NOT EXISTS scholarships (
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
            ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    "CREATE INDEX idx_scholarships_semester_id ON scholarships(semester_id)",

    `CREATE TABLE IF NOT EXISTS student_scholarships (
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
        CONSTRAINT uq_student_scholarships_unique UNIQUE (scholarship_id, student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    "CREATE INDEX idx_student_scholarships_student_id ON student_scholarships(student_id)",
    "CREATE INDEX idx_student_scholarships_scholarship_id ON student_scholarships(scholarship_id)",

    `CREATE TABLE IF NOT EXISTS disciplinary_actions (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    "CREATE INDEX idx_disciplinary_actions_student_id ON disciplinary_actions(student_id)",
    "CREATE INDEX idx_disciplinary_actions_semester_id ON disciplinary_actions(semester_id)",
    "CREATE INDEX idx_training_program_subjects_semester_order ON training_program_subjects(program_id, include_in_gpa, recommended_semester, display_order)"
];

const seedOperations = [
    {
        table: "enrollments",
        sql: `INSERT INTO enrollments (id, student_id, course_section_id, status) VALUES
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
            (24, 8, 12, 'active')`
    },
    {
        table: "grades",
        sql: `INSERT INTO grades (id, enrollment_id, attendance_score, midterm_score, final_score, total_score, letter_grade) VALUES
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
            (12, 22, 5.5, 5.0, 5.0, 5.1, 'D+')`
    },
    {
        table: "scholarships",
        sql: `INSERT INTO scholarships (id, name, description, amount, semester_id, min_gpa, status) VALUES
            (1, 'Hoc bong khuyen khich hoc tap', 'Hoc bong danh cho sinh vien co ket qua hoc tap tot', 3000000.00, 1, 3.20, 'active'),
            (2, 'Hoc bong vuot kho', 'Ho tro sinh vien co hoan canh kho khan', 2000000.00, 2, 2.50, 'active'),
            (3, 'Hoc bong nghien cuu khoa hoc', 'Khuyen khich sinh vien tham gia nghien cuu', 3500000.00, 4, 3.00, 'active')`
    },
    {
        table: "student_scholarships",
        sql: `INSERT INTO student_scholarships (id, scholarship_id, student_id, awarded_date, note, status) VALUES
            (1, 1, 1, '2025-01-10', 'Dat GPA hoc ky 1 loai gioi', 'approved'),
            (2, 2, 2, '2025-02-15', 'Ho tro hoc phi hoc ky 2', 'approved'),
            (3, 3, 6, '2025-03-20', 'Tham gia de tai khoa hoc cap khoa', 'approved')`
    },
    {
        table: "disciplinary_actions",
        sql: `INSERT INTO disciplinary_actions (id, student_id, semester_id, title, description, level, decision_date, status, decided_by) VALUES
            (1, 4, 1, 'Nhac nho di hoc muon', 'Sinh vien di hoc muon nhieu lan trong thang 10', 'nhac_nho', '2024-10-30', 'active', 1),
            (2, 2, 2, 'Canh cao hoc vu', 'Vang hoc khong phep qua so buoi quy dinh', 'canh_cao', '2025-02-28', 'active', 1),
            (3, 7, 1, 'Nhac nho tac phong', 'Vi pham noi quy dong phuc', 'nhac_nho', '2024-11-12', 'active', 1)`
    },
    {
        table: "tuitions",
        sql: `INSERT INTO tuitions (id, student_id, semester_id, total_credits, amount, paid_amount, status, due_date) VALUES
            (1, 1, 1, 6, 4500000.00, 4500000.00, 'paid', '2024-10-15'),
            (2, 2, 1, 6, 4500000.00, 2000000.00, 'partial', '2024-10-15'),
            (3, 3, 1, 6, 4500000.00, 0.00, 'unpaid', '2024-10-15'),
            (4, 4, 1, 6, 4500000.00, 4500000.00, 'paid', '2024-10-15'),
            (5, 5, 1, 2, 1800000.00, 0.00, 'unpaid', '2024-10-20'),
            (6, 1, 2, 6, 4800000.00, 1500000.00, 'partial', '2025-03-15'),
            (7, 6, 1, 6, 4500000.00, 4500000.00, 'paid', '2024-10-15'),
            (8, 7, 1, 6, 4500000.00, 2500000.00, 'partial', '2024-10-15'),
            (9, 8, 1, 4, 3000000.00, 0.00, 'unpaid', '2024-10-20')`
    },
    {
        table: "tuition_payments",
        sql: `INSERT INTO tuition_payments (id, tuition_id, payment_date, amount, payment_method, note) VALUES
            (1, 1, '2024-09-20', 4500000.00, 'bank', 'Thanh toan hoc phi HK1 day du'),
            (2, 2, '2024-09-22', 2000000.00, 'cash', 'Dong dot 1'),
            (3, 4, '2024-09-25', 4500000.00, 'vnpay', 'VNPAY_TXN_REF:DEMO0004'),
            (4, 6, '2025-02-20', 1500000.00, 'bank', 'Dong dot 1 HK2'),
            (5, 7, '2024-09-18', 4500000.00, 'bank', 'Thanh toan day du'),
            (6, 8, '2024-09-28', 2500000.00, 'cash', 'Dong mot phan hoc phi')`
    }
];

const upsertStatements = [
    `INSERT INTO faculties (id, name) VALUES
        (1, 'Công nghệ thông tin'),
        (2, 'Kinh tế'),
        (3, 'Điện - Điện tử')
     ON DUPLICATE KEY UPDATE
        name = VALUES(name)`,

    `INSERT INTO subjects (id, subject_code, name, credits, faculty_id) VALUES
        (13, 'BUS103', 'Quản trị học', 3, 2),
        (14, 'BUS104', 'Kinh tế vi mô', 3, 2),
        (15, 'BUS203', 'Hành vi tổ chức', 3, 2),
        (16, 'BUS204', 'Quản trị chiến lược', 3, 2),
        (17, 'BUS205', 'Quản trị dự án', 3, 2),
        (18, 'BUS301', 'Khởi nghiệp và đổi mới sáng tạo', 2, 2),
        (19, 'EE101', 'Mạch điện', 3, 3),
        (20, 'EE102', 'Kỹ thuật số', 3, 3),
        (21, 'EE201', 'Điện tử cơ bản', 3, 3),
        (22, 'EE202', 'Vi điều khiển', 3, 3),
        (23, 'EE203', 'Đo lường và cảm biến', 3, 3),
        (24, 'EE301', 'Hệ thống nhúng', 3, 3),
        (25, 'EE302', 'Truyền thông công nghiệp', 3, 3),
        (26, 'EE303', 'Internet of Things', 3, 3),
        (101, '922208', 'BD: Kiểm tra đánh giá thể lực', 1, 1),
        (102, '211214', 'Công dân số (2+1*)', 3, 1),
        (103, '111125', 'Đại số tuyến tính', 2, 1),
        (104, '711170', 'Kỹ năng mềm', 2, 1),
        (105, '211132', 'Lập trình Python cơ bản (2+1*)', 3, 1),
        (106, '911602', 'Pháp luật đại cương', 2, 1),
        (107, '911102', 'Triết học Mác - Lênin', 3, 1),
        (108, '231027', 'Cơ sở dữ liệu', 3, 1),
        (109, '211002', 'Co so ky thuat lap trinh (2+1*)', 3, 1),
        (110, '111126', 'Giai tich', 3, 1),
        (111, '131001', 'Hoa hoc dai cuong (1.5+0.5*)', 2, 1),
        (112, '221104', 'Kien truc may tinh', 3, 1),
        (113, '911203', 'Kinh te chinh tri Mac - Lenin', 2, 1),
        (114, '211131', 'Cau truc du lieu va giai thuat (2+1*)', 3, 1),
        (115, '111209', 'Giai tich so', 2, 1),
        (116, '221201', 'He dieu hanh', 3, 1),
        (117, '211156', 'He quan tri co so du lieu (2+1*)', 3, 1),
        (118, '211460', 'Lap trinh huong doi tuong (2+1*)', 3, 1),
        (119, '231028', 'Lap trinh ung dung Windows Form (2+1*)', 3, 1),
        (120, '211206', 'Cong nghe phan mem', 3, 1),
        (121, '211121', 'Do an 1', 3, 1),
        (122, '211140', 'Kiem thu phan mem (2+1*)', 3, 1),
        (123, '231005', 'Mang may tinh (2+1*)', 3, 1),
        (124, '221129', 'Thiet ke web co ban (2+1*)', 3, 1),
        (125, '151139', 'Tieng Anh 1', 2, 1),
        (126, '111010', 'Xac suat thong ke', 2, 1),
        (127, '211231', 'Do an 2', 3, 1),
        (128, '211034', 'Phan tich thiet ke huong doi tuong voi UML (2+1*)', 3, 1),
        (129, '221134', 'Phan tich thiet ke thuat toan', 2, 1),
        (130, '211125', 'Phat trien phan mem huong dich vu (2+1*)', 3, 1),
        (131, '151140', 'Tieng Anh 2', 3, 1),
        (132, '211011', 'Toan roi rac', 3, 1),
        (133, '911504', 'Tu tuong Ho Chi Minh', 2, 1),
        (134, '121249', 'Vat ly ky thuat', 4, 1),
        (135, '911302', 'Chu nghia xa hoi khoa hoc', 2, 1),
        (136, '211126', 'Cong nghe Web va ung dung (2+1*)', 3, 1),
        (137, '211123', 'Do an 3', 3, 1),
        (138, '211124', 'Lap trinh Mobile co ban (2+1*)', 3, 1),
        (139, '911409', 'Lich su Dang Cong San Viet Nam', 2, 1),
        (140, '211169', 'Phan tich nghiep vu phan mem', 3, 1),
        (141, '711106', 'Tam ly hoc ky thuat', 2, 1),
        (142, '151141', 'Tieng Anh 3', 2, 1),
        (143, '215685', 'Tieng Anh cho CNTT 1', 2, 1),
        (144, '931168', 'Dai cuong ve kinh te va moi truong', 2, 1),
        (145, '211148', 'Do an 4', 4, 1),
        (146, '221180', 'Hoc may co ban', 3, 1),
        (147, '211127', 'Phat trien ung dung Mobile da nen tang (2+1*)', 3, 1),
        (148, '231007', 'Thuc tap doanh nghiep', 12, 1),
        (149, '215687', 'Tieng Anh cho CNTT 2', 2, 1),
        (150, '231183', 'Do an/Khoa luan tot nghiep', 12, 1),
        (151, '921204', 'Giao duc quoc phong va an ninh', 5, 1),
        (152, '921113', 'Giao duc the chat 1', 1, 1),
        (153, '231044', 'Tieng Han So cap 1', 6, 1),
        (154, '921114', 'Giao duc the chat 2', 1, 1),
        (155, '921201', 'HP1 - Giao duc Quoc phong & An ninh', 3, 1),
        (156, '921202', 'HP2 - Giao duc Quoc phong & An ninh', 2, 1),
        (157, '921203', 'HP3 - Giao duc Quoc phong & An ninh', 2, 1),
        (158, '921205', 'HP4 - Giao duc Quoc phong & An ninh', 1, 1),
        (159, '921200', 'Thuc hanh giao duc quoc phong', 3, 1),
        (160, '921115', 'Giao duc the chat 3', 1, 1),
        (161, '151100', 'Tieng Anh tang cuong', 4, 1),
        (301, 'BUS111', 'Nhap mon quan tri kinh doanh', 3, 2),
        (302, 'BUS112', 'Kinh te hoc dai cuong', 3, 2),
        (303, 'BUS113', 'Ky nang giao tiep trong kinh doanh', 2, 2),
        (304, 'BUS114', 'Tin hoc ung dung trong kinh doanh', 3, 2),
        (305, 'BUS211', 'Nguyen ly marketing', 3, 2),
        (306, 'BUS212', 'Quan tri tai chinh', 3, 2),
        (307, 'BUS213', 'Quan tri van hanh', 3, 2),
        (308, 'BUS214', 'Quan tri nhan su nang cao', 3, 2),
        (309, 'BUS311', 'Quan tri du an dau tu', 3, 2),
        (310, 'BUS312', 'Thuong mai dien tu', 3, 2),
        (311, 'BUS313', 'Hanh vi nguoi tieu dung', 3, 2),
        (312, 'BUS314', 'Chien luoc kinh doanh', 3, 2),
        (313, 'BUS411', 'Khoi nghiep', 2, 2),
        (314, 'BUS412', 'Thuc tap doanh nghiep QTKD', 6, 2),
        (315, 'BUS413', 'Khoa luan tot nghiep QTKD', 9, 2),
        (401, 'EE111', 'Ky thuat dien co ban', 3, 3),
        (402, 'EE112', 'Ve ky thuat dien', 2, 3),
        (403, 'EE113', 'An toan dien', 2, 3),
        (404, 'EE114', 'Lap trinh vi dieu khien co ban', 3, 3),
        (405, 'EE211', 'Dien tu cong suat', 3, 3),
        (406, 'EE212', 'Mach tuong tu', 3, 3),
        (407, 'EE213', 'Mach so nang cao', 3, 3),
        (408, 'EE214', 'He thong dieu khien tu dong', 3, 3),
        (409, 'EE311', 'PLC va ung dung', 3, 3),
        (410, 'EE312', 'Cam bien cong nghiep', 3, 3),
        (411, 'EE313', 'IoT cong nghiep', 3, 3),
        (412, 'EE314', 'He thong nhung nang cao', 3, 3),
        (413, 'EE411', 'Thuc tap doanh nghiep Dien - Dien tu', 6, 3),
        (414, 'EE412', 'Do an tot nghiep Dien - Dien tu', 9, 3)
     ON DUPLICATE KEY UPDATE
        subject_code = VALUES(subject_code),
        name = VALUES(name),
        credits = VALUES(credits),
        faculty_id = VALUES(faculty_id)`,

    `INSERT INTO training_programs (id, faculty_id, code, name, total_credits_required, elective_credits_required, status, description) VALUES
        (1, 1, 'CNTT-2024', 'Chương trình đào tạo Công nghệ thông tin K24', 143, 0, 'active', 'Khung chương trình đào tạo Công nghệ thông tin tham chiếu theo bảng chương trình 8 kỳ'),
        (2, 2, 'QTKD-2024', 'Chương trình đào tạo Quản trị kinh doanh K24', 123, 9, 'active', 'Khung chương trình đào tạo Quản trị kinh doanh theo cấu trúc 8 kỳ'),
        (3, 3, 'D-DT-2024', 'Chương trình đào tạo Điện - Điện tử K24', 124, 9, 'active', 'Khung chương trình đào tạo Điện - Điện tử theo cấu trúc 8 kỳ')
     ON DUPLICATE KEY UPDATE
        faculty_id = VALUES(faculty_id),
        code = VALUES(code),
        name = VALUES(name),
        total_credits_required = VALUES(total_credits_required),
        elective_credits_required = VALUES(elective_credits_required),
        status = VALUES(status),
        description = VALUES(description)`,

    `INSERT INTO graduation_requirements
        (id, program_id, min_cumulative_gpa, min_earned_credits, max_failed_subjects, required_english_level, required_it_level, status)
     VALUES
        (1, 1, 2.00, 143, 0, 'B1', 'Co ban', 'active'),
        (2, 2, 2.00, 123, 0, 'B1', 'Co ban', 'active'),
        (3, 3, 2.00, 124, 0, 'B1', 'Co ban', 'active')
     ON DUPLICATE KEY UPDATE
        program_id = VALUES(program_id),
        min_cumulative_gpa = VALUES(min_cumulative_gpa),
        min_earned_credits = VALUES(min_earned_credits),
        max_failed_subjects = VALUES(max_failed_subjects),
        required_english_level = VALUES(required_english_level),
        required_it_level = VALUES(required_it_level),
        status = VALUES(status)`,

    `INSERT INTO student_programs (id, student_id, program_id, start_date, expected_graduation_date, status) VALUES
        (1, 1, 1, '2024-09-01', '2028-06-30', 'active'),
        (2, 2, 1, '2024-09-01', '2028-06-30', 'active'),
        (3, 3, 1, '2024-09-01', '2028-06-30', 'active'),
        (4, 4, 1, '2024-09-01', '2028-06-30', 'active'),
        (5, 5, 2, '2024-09-01', '2028-06-30', 'active'),
        (6, 6, 1, '2024-09-01', '2028-06-30', 'active'),
        (7, 7, 1, '2024-09-01', '2028-06-30', 'active'),
        (8, 8, 2, '2024-09-01', '2028-06-30', 'active')
     ON DUPLICATE KEY UPDATE
        student_id = VALUES(student_id),
        program_id = VALUES(program_id),
        start_date = VALUES(start_date),
        expected_graduation_date = VALUES(expected_graduation_date),
        status = VALUES(status)`
];

const ensureTable = async (table, createSql) => {
    const [rows] = await db.query(`SHOW TABLES LIKE ?`, [table]);

    if (rows.length > 0) {
        return false;
    }

    await db.query(createSql);
    return true;
};

const ensureIndex = async (statement) => {
    try {
        await db.query(statement);
    } catch (error) {
        if (!String(error.message).includes("Duplicate key name")) {
            throw error;
        }
    }
};

const ensureColumn = async (table, column, definition) => {
    const [rows] = await db.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);

    if (rows.length > 0) {
        return false;
    }

    await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    return true;
};

const refreshCurriculum = async () => {
    const curriculumStatements = [
        "DELETE FROM training_program_subjects WHERE program_id IN (1, 2, 3)",
        `INSERT INTO training_program_subjects
            (id, program_id, subject_id, subject_type, recommended_semester, display_order, total_hours, elearning, include_in_gpa, min_score_required)
         VALUES
            (1001, 1, 101, 'required', 1, 1, 0, NULL, 1, 5.0),
            (1002, 1, 102, 'required', 1, 2, 60, NULL, 1, 5.0),
            (1003, 1, 103, 'required', 1, 3, 30, NULL, 1, 5.0),
            (1004, 1, 104, 'required', 1, 4, 30, NULL, 1, 5.0),
            (1005, 1, 105, 'required', 1, 5, 60, NULL, 1, 5.0),
            (1006, 1, 106, 'required', 1, 6, 30, NULL, 1, 5.0),
            (1007, 1, 107, 'required', 1, 7, 45, NULL, 1, 5.0),
            (1008, 1, 108, 'required', 2, 1, 45, NULL, 1, 5.0),
            (1009, 1, 109, 'required', 2, 2, 60, NULL, 1, 5.0),
            (1010, 1, 110, 'required', 2, 3, 45, NULL, 1, 5.0),
            (1011, 1, 111, 'required', 2, 4, 38, NULL, 1, 5.0),
            (1012, 1, 112, 'required', 2, 5, 45, NULL, 1, 5.0),
            (1013, 1, 113, 'required', 2, 6, 30, NULL, 1, 5.0),
            (1014, 1, 114, 'required', 3, 1, 60, NULL, 1, 5.0),
            (1015, 1, 115, 'required', 3, 2, 30, NULL, 1, 5.0),
            (1016, 1, 116, 'required', 3, 3, 45, NULL, 1, 5.0),
            (1017, 1, 117, 'required', 3, 4, 60, NULL, 1, 5.0),
            (1018, 1, 118, 'required', 3, 5, 60, NULL, 1, 5.0),
            (1019, 1, 119, 'required', 3, 6, 60, NULL, 1, 5.0),
            (1020, 1, 120, 'required', 4, 1, 45, NULL, 1, 5.0),
            (1021, 1, 121, 'required', 4, 2, 24, NULL, 1, 5.0),
            (1022, 1, 122, 'required', 4, 3, 60, NULL, 1, 5.0),
            (1023, 1, 123, 'required', 4, 4, 60, NULL, 1, 5.0),
            (1024, 1, 124, 'required', 4, 5, 60, NULL, 1, 5.0),
            (1025, 1, 125, 'required', 4, 6, 30, NULL, 1, 5.0),
            (1026, 1, 126, 'required', 4, 7, 30, NULL, 1, 5.0),
            (1027, 1, 127, 'required', 5, 1, 24, NULL, 1, 5.0),
            (1028, 1, 128, 'required', 5, 2, 60, NULL, 1, 5.0),
            (1029, 1, 129, 'required', 5, 3, 30, NULL, 1, 5.0),
            (1030, 1, 130, 'required', 5, 4, 60, NULL, 1, 5.0),
            (1031, 1, 131, 'required', 5, 5, 45, NULL, 1, 5.0),
            (1032, 1, 132, 'required', 5, 6, 45, NULL, 1, 5.0),
            (1033, 1, 133, 'required', 5, 7, 30, NULL, 1, 5.0),
            (1034, 1, 134, 'required', 5, 8, 90, NULL, 1, 5.0),
            (1035, 1, 135, 'required', 6, 1, 30, NULL, 1, 5.0),
            (1036, 1, 136, 'required', 6, 2, 60, NULL, 1, 5.0),
            (1037, 1, 137, 'required', 6, 3, 24, NULL, 1, 5.0),
            (1038, 1, 138, 'required', 6, 4, 60, NULL, 1, 5.0),
            (1039, 1, 139, 'required', 6, 5, 30, NULL, 1, 5.0),
            (1040, 1, 140, 'required', 6, 6, 45, NULL, 1, 5.0),
            (1041, 1, 141, 'required', 6, 7, 30, NULL, 1, 5.0),
            (1042, 1, 142, 'required', 6, 8, 30, NULL, 1, 5.0),
            (1043, 1, 143, 'required', 6, 9, 30, NULL, 1, 5.0),
            (1044, 1, 144, 'required', 7, 1, 30, NULL, 1, 5.0),
            (1045, 1, 145, 'required', 7, 2, 24, NULL, 1, 5.0),
            (1046, 1, 146, 'required', 7, 3, 45, NULL, 1, 5.0),
            (1047, 1, 147, 'required', 7, 4, 60, NULL, 1, 5.0),
            (1048, 1, 148, 'required', 7, 5, 120, NULL, 1, 5.0),
            (1049, 1, 149, 'required', 7, 6, 30, NULL, 1, 5.0),
            (1050, 1, 150, 'required', 8, 1, 0, NULL, 1, 5.0),
            (1051, 1, 151, 'required', 1, 8, 0, NULL, 0, 5.0),
            (1052, 1, 152, 'required', 1, 9, 30, NULL, 0, 5.0),
            (1053, 1, 153, 'elective', 1, 10, 0, NULL, 0, 5.0),
            (1054, 1, 154, 'required', 2, 7, 30, NULL, 0, 5.0),
            (1055, 1, 155, 'required', 2, 8, 0, NULL, 0, 5.0),
            (1056, 1, 156, 'required', 2, 9, 0, NULL, 0, 5.0),
            (1057, 1, 157, 'required', 2, 10, 0, NULL, 0, 5.0),
            (1058, 1, 158, 'required', 2, 11, 0, NULL, 0, 5.0),
            (1059, 1, 159, 'required', 2, 12, 15, NULL, 0, 5.0),
            (1060, 1, 160, 'required', 3, 7, 30, NULL, 0, 5.0),
            (1061, 1, 161, 'required', 3, 8, 60, NULL, 0, 5.0),
            (2001, 2, 301, 'required', 1, 1, 45, NULL, 1, 5.0),
            (2002, 2, 302, 'required', 1, 2, 45, NULL, 1, 5.0),
            (2003, 2, 303, 'required', 1, 3, 30, NULL, 1, 5.0),
            (2004, 2, 304, 'required', 1, 4, 45, NULL, 1, 5.0),
            (2005, 2, 7, 'required', 1, 5, 30, NULL, 1, 5.0),
            (2006, 2, 10, 'required', 2, 1, 30, NULL, 1, 5.0),
            (2007, 2, 11, 'required', 2, 2, 30, NULL, 1, 5.0),
            (2008, 2, 12, 'required', 2, 3, 30, NULL, 1, 5.0),
            (2009, 2, 13, 'required', 2, 4, 45, NULL, 1, 5.0),
            (2010, 2, 14, 'required', 2, 5, 45, NULL, 1, 5.0),
            (2011, 2, 15, 'required', 3, 1, 45, NULL, 1, 5.0),
            (2012, 2, 16, 'required', 3, 2, 45, NULL, 1, 5.0),
            (2013, 2, 17, 'required', 4, 1, 45, NULL, 1, 5.0),
            (2014, 2, 18, 'elective', 4, 2, 30, NULL, 1, 5.0),
            (2015, 2, 305, 'required', 4, 3, 45, NULL, 1, 5.0),
            (2016, 2, 306, 'required', 5, 1, 45, NULL, 1, 5.0),
            (2017, 2, 307, 'required', 5, 2, 45, NULL, 1, 5.0),
            (2018, 2, 308, 'required', 5, 3, 45, NULL, 1, 5.0),
            (2019, 2, 309, 'elective', 6, 1, 45, NULL, 1, 5.0),
            (2020, 2, 310, 'required', 6, 2, 45, NULL, 1, 5.0),
            (2021, 2, 311, 'elective', 6, 3, 45, NULL, 1, 5.0),
            (2022, 2, 312, 'required', 7, 1, 45, NULL, 1, 5.0),
            (2023, 2, 313, 'elective', 7, 2, 30, NULL, 1, 5.0),
            (2024, 2, 314, 'required', 8, 1, 90, NULL, 1, 5.0),
            (2025, 2, 315, 'required', 8, 2, 0, NULL, 1, 5.0),
            (3001, 3, 401, 'required', 1, 1, 45, NULL, 1, 5.0),
            (3002, 3, 402, 'required', 1, 2, 30, NULL, 1, 5.0),
            (3003, 3, 403, 'required', 1, 3, 30, NULL, 1, 5.0),
            (3004, 3, 19, 'required', 1, 4, 45, NULL, 1, 5.0),
            (3005, 3, 20, 'required', 2, 1, 45, NULL, 1, 5.0),
            (3006, 3, 21, 'required', 2, 2, 45, NULL, 1, 5.0),
            (3007, 3, 22, 'required', 2, 3, 45, NULL, 1, 5.0),
            (3008, 3, 23, 'required', 3, 1, 45, NULL, 1, 5.0),
            (3009, 3, 404, 'required', 3, 2, 60, NULL, 1, 5.0),
            (3010, 3, 405, 'required', 4, 1, 45, NULL, 1, 5.0),
            (3011, 3, 406, 'required', 4, 2, 45, NULL, 1, 5.0),
            (3012, 3, 407, 'required', 5, 1, 45, NULL, 1, 5.0),
            (3013, 3, 408, 'required', 5, 2, 45, NULL, 1, 5.0),
            (3014, 3, 24, 'required', 6, 1, 45, NULL, 1, 5.0),
            (3015, 3, 25, 'elective', 6, 2, 45, NULL, 1, 5.0),
            (3016, 3, 26, 'elective', 7, 1, 45, NULL, 1, 5.0),
            (3017, 3, 409, 'required', 7, 2, 45, NULL, 1, 5.0),
            (3018, 3, 410, 'required', 7, 3, 45, NULL, 1, 5.0),
            (3019, 3, 411, 'elective', 8, 1, 45, NULL, 1, 5.0),
            (3020, 3, 412, 'required', 8, 2, 45, NULL, 1, 5.0),
            (3021, 3, 413, 'required', 8, 3, 90, NULL, 1, 5.0),
            (3022, 3, 414, 'required', 8, 4, 0, NULL, 1, 5.0)`
    ];

    for (const statement of curriculumStatements) {
        await db.query(statement);
    }
};

const refreshRetakeImprovementDemo = async () => {
    const demoStatements = [
        `INSERT INTO course_sections (id, subject_id, lecturer_id, semester_id, max_students)
         VALUES (101, 2, 1, 4, 50)
         ON DUPLICATE KEY UPDATE
            subject_id = VALUES(subject_id),
            lecturer_id = VALUES(lecturer_id),
            semester_id = VALUES(semester_id),
            max_students = VALUES(max_students)`,
        `INSERT INTO schedules (id, course_section_id, day_of_week, start_time, end_time, room)
         VALUES
            (201, 101, 'Thu 2', '09:15:00', '11:15:00', 'A104'),
            (202, 101, 'Thu 5', '09:15:00', '11:15:00', 'A104')
         ON DUPLICATE KEY UPDATE
            course_section_id = VALUES(course_section_id),
            day_of_week = VALUES(day_of_week),
            start_time = VALUES(start_time),
            end_time = VALUES(end_time),
            room = VALUES(room)`,
        `INSERT INTO enrollments (id, student_id, course_section_id, status)
         VALUES
            (101, 4, 101, 'active'),
            (102, 7, 101, 'active')
         ON DUPLICATE KEY UPDATE
            student_id = VALUES(student_id),
            course_section_id = VALUES(course_section_id),
            status = VALUES(status)`,
        `INSERT INTO tuitions (id, student_id, semester_id, total_credits, amount, paid_amount, status, due_date)
         VALUES
            (101, 4, 4, 3, 1440000.00, 0.00, 'unpaid', '2025-10-15'),
            (102, 7, 4, 3, 1440000.00, 0.00, 'unpaid', '2025-10-15')
         ON DUPLICATE KEY UPDATE
            total_credits = VALUES(total_credits),
            amount = VALUES(amount),
            paid_amount = VALUES(paid_amount),
            status = VALUES(status),
            due_date = VALUES(due_date)`
    ];

    for (const statement of demoStatements) {
        await db.query(statement);
    }
};

const countRows = async (table) => {
    const [rows] = await db.query(`SELECT COUNT(*) AS total FROM ${table}`);
    return Number(rows[0]?.total || 0);
};

const main = async () => {
    try {
        console.log("Repairing database", process.env.DB_NAME);

        await ensureColumn("training_program_subjects", "display_order", "INT NOT NULL DEFAULT 1 AFTER recommended_semester");
        await ensureColumn("training_program_subjects", "total_hours", "INT NOT NULL DEFAULT 0 AFTER display_order");
        await ensureColumn("training_program_subjects", "elearning", "VARCHAR(255) NULL AFTER total_hours");
        await ensureColumn("training_program_subjects", "include_in_gpa", "TINYINT(1) NOT NULL DEFAULT 1 AFTER elearning");

        for (const statement of createStatements) {
            const match = statement.match(/^CREATE TABLE IF NOT EXISTS ([a-z_]+)/i);

            if (match) {
                const created = await ensureTable(match[1], statement);
                console.log(created ? `created table ${match[1]}` : `table ${match[1]} already exists`);
                continue;
            }

            await ensureIndex(statement);
        }

        for (const op of seedOperations) {
            const total = await countRows(op.table);

            if (total > 0) {
                console.log(`skip seed ${op.table} (${total} rows)`);
                continue;
            }

            await db.query(op.sql);
            console.log(`seeded ${op.table}`);
        }

        for (const statement of upsertStatements) {
            await db.query(statement);
        }
        await refreshCurriculum();
        await refreshRetakeImprovementDemo();
        console.log("upserted extended curriculum data");

        console.log("Repair complete");
        process.exit(0);
    } catch (error) {
        console.error("Repair failed:", error.message);
        process.exit(1);
    }
};

main();
