require("dotenv").config();

const db = require("../config/db");

const ensureSubjectsFacultyLink = async () => {
    const [columnRows] = await db.query("SHOW COLUMNS FROM subjects LIKE 'faculty_id'");

    if (columnRows.length === 0) {
        await db.query("ALTER TABLE subjects ADD COLUMN faculty_id INT NULL AFTER credits");
    }

    await db.query(`
        UPDATE subjects s
        LEFT JOIN (
            SELECT
                tps.subject_id,
                MIN(tp.faculty_id) AS faculty_id
            FROM training_program_subjects tps
            INNER JOIN training_programs tp ON tp.id = tps.program_id
            GROUP BY tps.subject_id
        ) mapped ON mapped.subject_id = s.id
        SET s.faculty_id = COALESCE(
            s.faculty_id,
            mapped.faculty_id,
            CASE
                WHEN s.subject_code LIKE 'IT%' THEN 1
                WHEN s.subject_code LIKE 'BUS%' THEN 2
                WHEN s.subject_code LIKE 'EE%' THEN 3
                ELSE 1
            END
        )
        WHERE s.faculty_id IS NULL
    `);

    const [nullRows] = await db.query("SELECT COUNT(*) AS total FROM subjects WHERE faculty_id IS NULL");
    if (Number(nullRows[0]?.total || 0) > 0) {
        throw new Error("Khong the gan faculty_id cho tat ca subjects");
    }

    await db.query("ALTER TABLE subjects MODIFY COLUMN faculty_id INT NOT NULL");

    const [indexRows] = await db.query("SHOW INDEX FROM subjects WHERE Key_name = 'idx_subjects_faculty_id'");
    if (indexRows.length === 0) {
        await db.query("CREATE INDEX idx_subjects_faculty_id ON subjects(faculty_id)");
    }

    const [constraintRows] = await db.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'subjects'
          AND CONSTRAINT_NAME = 'fk_subjects_faculty'
    `);

    if (constraintRows.length === 0) {
        await db.query(`
            ALTER TABLE subjects
            ADD CONSTRAINT fk_subjects_faculty
            FOREIGN KEY (faculty_id) REFERENCES faculties(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT
        `);
    }
};

const statements = [
    `CREATE TABLE IF NOT EXISTS training_programs (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS training_program_subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        program_id INT NOT NULL,
        subject_id INT NOT NULL,
        subject_type VARCHAR(20) NOT NULL DEFAULT 'required',
        recommended_semester INT NULL,
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS graduation_requirements (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS student_programs (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS student_status_records (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

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
            ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

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

    `CREATE TABLE IF NOT EXISTS academic_advisors (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS student_documents (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    "CREATE INDEX idx_training_programs_faculty_id ON training_programs(faculty_id)",
    "CREATE INDEX idx_training_program_subjects_program_id ON training_program_subjects(program_id)",
    "CREATE INDEX idx_training_program_subjects_subject_id ON training_program_subjects(subject_id)",
    "CREATE INDEX idx_graduation_requirements_program_id ON graduation_requirements(program_id)",
    "CREATE INDEX idx_student_programs_student_id ON student_programs(student_id)",
    "CREATE INDEX idx_student_programs_program_id ON student_programs(program_id)",
    "CREATE INDEX idx_student_status_records_student_id ON student_status_records(student_id)",
    "CREATE INDEX idx_student_status_records_status ON student_status_records(status)",
    "CREATE INDEX idx_scholarships_semester_id ON scholarships(semester_id)",
    "CREATE INDEX idx_student_scholarships_student_id ON student_scholarships(student_id)",
    "CREATE INDEX idx_student_scholarships_scholarship_id ON student_scholarships(scholarship_id)",
    "CREATE INDEX idx_disciplinary_actions_student_id ON disciplinary_actions(student_id)",
    "CREATE INDEX idx_disciplinary_actions_semester_id ON disciplinary_actions(semester_id)",
    "CREATE INDEX idx_academic_advisors_lecturer_id ON academic_advisors(lecturer_id)",
    "CREATE INDEX idx_academic_advisors_class_id ON academic_advisors(class_id)",
    "CREATE INDEX idx_academic_advisors_student_id ON academic_advisors(student_id)",
    "CREATE INDEX idx_student_documents_student_id ON student_documents(student_id)"
];

const seedStatements = [
    `INSERT INTO training_programs (id, faculty_id, code, name, total_credits_required, elective_credits_required, status, description)
     SELECT 1, 1, 'CNTT-2024', 'Chương trình đào tạo Công nghệ thông tin K24', 15, 3, 'active', 'Áp dụng cho sinh viên CNTT khóa 2024'
     WHERE NOT EXISTS (SELECT 1 FROM training_programs WHERE id = 1)`,

    `INSERT INTO training_programs (id, faculty_id, code, name, total_credits_required, elective_credits_required, status, description)
     SELECT 2, 2, 'QTKD-2024', 'Chương trình đào tạo Quản trị kinh doanh K24', 2, 0, 'active', 'Áp dụng cho sinh viên QTKD khóa 2024'
     WHERE NOT EXISTS (SELECT 1 FROM training_programs WHERE id = 2)`,

    `INSERT INTO training_program_subjects (id, program_id, subject_id, subject_type, recommended_semester, min_score_required)
     SELECT 1, 1, 1, 'required', 1, 4.0
     WHERE EXISTS (SELECT 1 FROM training_programs WHERE id = 1)
       AND EXISTS (SELECT 1 FROM subjects WHERE id = 1)
       AND NOT EXISTS (SELECT 1 FROM training_program_subjects WHERE id = 1)`,

    `INSERT INTO training_program_subjects (id, program_id, subject_id, subject_type, recommended_semester, min_score_required)
     SELECT 2, 1, 2, 'required', 1, 4.0
     WHERE EXISTS (SELECT 1 FROM training_programs WHERE id = 1)
       AND EXISTS (SELECT 1 FROM subjects WHERE id = 2)
       AND NOT EXISTS (SELECT 1 FROM training_program_subjects WHERE id = 2)`,

    `INSERT INTO training_program_subjects (id, program_id, subject_id, subject_type, recommended_semester, min_score_required)
     SELECT 3, 1, 3, 'required', 2, 4.0
     WHERE EXISTS (SELECT 1 FROM training_programs WHERE id = 1)
       AND EXISTS (SELECT 1 FROM subjects WHERE id = 3)
       AND NOT EXISTS (SELECT 1 FROM training_program_subjects WHERE id = 3)`,

    `INSERT INTO training_program_subjects (id, program_id, subject_id, subject_type, recommended_semester, min_score_required)
     SELECT 4, 1, 4, 'required', 2, 4.0
     WHERE EXISTS (SELECT 1 FROM training_programs WHERE id = 1)
       AND EXISTS (SELECT 1 FROM subjects WHERE id = 4)
       AND NOT EXISTS (SELECT 1 FROM training_program_subjects WHERE id = 4)`,

    `INSERT INTO training_program_subjects (id, program_id, subject_id, subject_type, recommended_semester, min_score_required)
     SELECT 5, 1, 5, 'elective', 3, 4.0
     WHERE EXISTS (SELECT 1 FROM training_programs WHERE id = 1)
       AND EXISTS (SELECT 1 FROM subjects WHERE id = 5)
       AND NOT EXISTS (SELECT 1 FROM training_program_subjects WHERE id = 5)`,

    `INSERT INTO training_program_subjects (id, program_id, subject_id, subject_type, recommended_semester, min_score_required)
     SELECT 6, 1, 6, 'elective', 3, 4.0
     WHERE EXISTS (SELECT 1 FROM training_programs WHERE id = 1)
       AND EXISTS (SELECT 1 FROM subjects WHERE id = 6)
       AND NOT EXISTS (SELECT 1 FROM training_program_subjects WHERE id = 6)`,

    `INSERT INTO training_program_subjects (id, program_id, subject_id, subject_type, recommended_semester, min_score_required)
     SELECT 7, 2, 7, 'required', 1, 4.0
     WHERE EXISTS (SELECT 1 FROM training_programs WHERE id = 2)
       AND EXISTS (SELECT 1 FROM subjects WHERE id = 7)
       AND NOT EXISTS (SELECT 1 FROM training_program_subjects WHERE id = 7)`,

    `INSERT INTO graduation_requirements (id, program_id, min_cumulative_gpa, min_earned_credits, max_failed_subjects, required_english_level, required_it_level, status)
     SELECT 1, 1, 2.00, 15, 0, 'B1', 'Co ban', 'active'
     WHERE EXISTS (SELECT 1 FROM training_programs WHERE id = 1)
       AND NOT EXISTS (SELECT 1 FROM graduation_requirements WHERE id = 1)`,

    `INSERT INTO graduation_requirements (id, program_id, min_cumulative_gpa, min_earned_credits, max_failed_subjects, required_english_level, required_it_level, status)
     SELECT 2, 2, 2.00, 2, 0, NULL, NULL, 'active'
     WHERE EXISTS (SELECT 1 FROM training_programs WHERE id = 2)
       AND NOT EXISTS (SELECT 1 FROM graduation_requirements WHERE id = 2)`,

    `INSERT INTO student_programs (id, student_id, program_id, start_date, expected_graduation_date, status)
     SELECT 1, 1, 1, '2024-09-01', '2028-06-30', 'active'
     WHERE EXISTS (SELECT 1 FROM student_info WHERE id = 1)
       AND NOT EXISTS (SELECT 1 FROM student_programs WHERE id = 1)`,

    `INSERT INTO student_programs (id, student_id, program_id, start_date, expected_graduation_date, status)
     SELECT 2, 2, 1, '2024-09-01', '2028-06-30', 'active'
     WHERE EXISTS (SELECT 1 FROM student_info WHERE id = 2)
       AND NOT EXISTS (SELECT 1 FROM student_programs WHERE id = 2)`,

    `INSERT INTO student_programs (id, student_id, program_id, start_date, expected_graduation_date, status)
     SELECT 3, 3, 1, '2024-09-01', '2028-06-30', 'active'
     WHERE EXISTS (SELECT 1 FROM student_info WHERE id = 3)
       AND NOT EXISTS (SELECT 1 FROM student_programs WHERE id = 3)`,

    `INSERT INTO student_programs (id, student_id, program_id, start_date, expected_graduation_date, status)
     SELECT 4, 4, 1, '2024-09-01', '2028-06-30', 'active'
     WHERE EXISTS (SELECT 1 FROM student_info WHERE id = 4)
       AND NOT EXISTS (SELECT 1 FROM student_programs WHERE id = 4)`,

    `INSERT INTO student_programs (id, student_id, program_id, start_date, expected_graduation_date, status)
     SELECT 5, 5, 2, '2024-09-01', '2028-06-30', 'active'
     WHERE EXISTS (SELECT 1 FROM student_info WHERE id = 5)
       AND NOT EXISTS (SELECT 1 FROM student_programs WHERE id = 5)`,

    `INSERT INTO scholarships (name, description, amount, semester_id, min_gpa, status)
     SELECT 'Hoc bong khuyen khich hoc tap', 'Hoc bong danh cho sinh vien co ket qua hoc tap tot', 3000000.00, 1, 3.20, 'active'
     WHERE NOT EXISTS (SELECT 1 FROM scholarships)`,

    `INSERT INTO scholarships (name, description, amount, semester_id, min_gpa, status)
     SELECT 'Hoc bong vuot kho', 'Ho tro sinh vien co hoan canh kho khan', 2000000.00, 2, 2.50, 'active'
     WHERE NOT EXISTS (SELECT 1 FROM scholarships WHERE name = 'Hoc bong vuot kho')`,

    `INSERT INTO disciplinary_actions (student_id, semester_id, title, description, level, decision_date, status, decided_by)
     SELECT 1, 1, 'Nhac nho di hoc muon', 'Sinh vien di hoc muon nhieu lan', 'nhac_nho', CURDATE(), 'active', 1
     WHERE EXISTS (SELECT 1 FROM student_info WHERE id = 1)
       AND NOT EXISTS (SELECT 1 FROM disciplinary_actions)`
];

const ignorableIndexErrors = new Set(["ER_DUP_KEYNAME"]);

async function run() {
    for (const statement of statements) {
        try {
            await db.query(statement);
        } catch (error) {
            if (!ignorableIndexErrors.has(error.code)) {
                throw error;
            }
        }
    }

    await ensureSubjectsFacultyLink();

    for (const statement of seedStatements) {
        await db.query(statement);
    }

    await db.query(
        `ALTER TABLE training_program_subjects
         MODIFY COLUMN min_score_required DECIMAL(4,1) NOT NULL DEFAULT 5.0`
    );

    await db.query(
        `UPDATE training_program_subjects
         SET min_score_required = 5.0
         WHERE min_score_required < 5.0`
    );

    console.log("Extended schema ensured successfully.");
    process.exit(0);
}

run().catch((error) => {
    console.error("Failed to ensure extended schema:", error.message);
    process.exit(1);
});
