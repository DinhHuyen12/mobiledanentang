const db = require("../config/db");

const INACTIVE_ENROLLMENT_STATUSES = ["pending", "cancelled", "canceled", "dropped", "rejected"];
const STANDARD_MONTHLY_TUITION = 1790000;
const STANDARD_MONTHS_PER_SEMESTER = 5;
const STANDARD_SEMESTER_TUITION = STANDARD_MONTHLY_TUITION * STANDARD_MONTHS_PER_SEMESTER;
const RETAKE_CREDIT_TUITION = 480000;

const buildTuitionSelect = () => `
    SELECT
        t.id,
        t.student_id,
        si.user_id,
        si.class_id,
        c.name AS class_name,
        c.faculty_id,
        f.name AS faculty_name,
        u.full_name AS student_name,
        u.email AS student_email,
        t.semester_id,
        sem.name AS semester_name,
        t.total_credits,
        t.amount,
        t.amount AS billed_amount,
        t.amount AS total_amount,
        t.amount AS total_receivable,
        t.amount AS receivable_amount,
        COALESCE(payment_summary.paid_amount, 0) AS paid_amount,
        COALESCE(payment_summary.paid_amount, 0) AS total_paid,
        COALESCE(payment_summary.paid_amount, 0) AS total_paid_amount,
        COALESCE(payment_summary.paid_amount, 0) AS collected_amount,
        GREATEST(t.amount - COALESCE(payment_summary.paid_amount, 0), 0) AS remaining_amount,
        GREATEST(t.amount - COALESCE(payment_summary.paid_amount, 0), 0) AS outstanding_amount,
        GREATEST(t.amount - COALESCE(payment_summary.paid_amount, 0), 0) AS debt_amount,
        GREATEST(t.amount - COALESCE(payment_summary.paid_amount, 0), 0) AS total_debt,
        CASE
            WHEN COALESCE(payment_summary.paid_amount, 0) >= t.amount AND t.amount > 0 THEN 'paid'
            WHEN COALESCE(payment_summary.paid_amount, 0) > 0 THEN 'partial'
            ELSE COALESCE(t.status, 'unpaid')
        END AS status,
        t.due_date,
        t.created_at
    FROM tuitions t
    LEFT JOIN student_info si ON t.student_id = si.id
    LEFT JOIN classes c ON si.class_id = c.id
    LEFT JOIN faculties f ON c.faculty_id = f.id
    LEFT JOIN users u ON si.user_id = u.id
    LEFT JOIN semesters sem ON t.semester_id = sem.id
    LEFT JOIN (
        SELECT tuition_id, SUM(amount) AS paid_amount
        FROM tuition_payments
        GROUP BY tuition_id
    ) payment_summary ON payment_summary.tuition_id = t.id
`;

const buildInactiveStatusPlaceholders = () =>
    INACTIVE_ENROLLMENT_STATUSES.map(() => "?").join(", ");

const normalizeTuitionStatus = (amount, paidAmount) => {
    if (paidAmount >= amount && amount > 0) {
        return "paid";
    }

    if (paidAmount > 0) {
        return "partial";
    }

    return "unpaid";
};

const calculateTuitionAmountFromRows = (rows) => {
    const totalCredits = rows.reduce((sum, row) => sum + Number(row.credits || 0), 0);
    const regularCredits = rows
        .filter((row) => row.enrollment_type === "hoc_di")
        .reduce((sum, row) => sum + Number(row.credits || 0), 0);
    const retakeCredits = rows
        .filter((row) => row.enrollment_type === "hoc_lai")
        .reduce((sum, row) => sum + Number(row.credits || 0), 0);
    const improvementCredits = rows
        .filter((row) => row.enrollment_type === "hoc_cai_thien")
        .reduce((sum, row) => sum + Number(row.credits || 0), 0);
    const regularAmount = regularCredits > 0 ? STANDARD_SEMESTER_TUITION : 0;
    const retakeAmount = retakeCredits * RETAKE_CREDIT_TUITION;
    const improvementAmount = improvementCredits * RETAKE_CREDIT_TUITION;

    return {
        total_credits: totalCredits,
        regular_credits: regularCredits,
        retake_credits: retakeCredits,
        improvement_credits: improvementCredits,
        regular_amount: regularAmount,
        retake_amount: retakeAmount,
        improvement_amount: improvementAmount,
        amount: regularAmount + retakeAmount + improvementAmount
    };
};

const tuitionsModel = {
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

    getAll: async () => {
        const [rows] = await db.query(`
            ${buildTuitionSelect()}
            ORDER BY t.id ASC
        `);

        return rows;
    },

    getAllForUser: async (user) => {
        const roleId = Number(user?.role_id || user?.role);

        if (roleId === 1) {
            return tuitionsModel.getAll();
        }

        if (roleId === 3) {
            const studentInfo = await tuitionsModel.getStudentInfoByUserId(user.id);

            if (!studentInfo) {
                return [];
            }

            const [rows] = await db.query(
                `
                ${buildTuitionSelect()}
                WHERE t.student_id = ?
                ORDER BY t.id ASC
                `,
                [studentInfo.id]
            );

            return rows;
        }

        return [];
    },

    getById: async (id) => {
        const [rows] = await db.query(`
            ${buildTuitionSelect()}
            WHERE t.id = ?
        `, [id]);

        return rows[0];
    },

    getByIdForUser: async (id, user) => {
        const roleId = Number(user?.role_id || user?.role);

        if (roleId === 1) {
            return tuitionsModel.getById(id);
        }

        if (roleId === 3) {
            const studentInfo = await tuitionsModel.getStudentInfoByUserId(user.id);

            if (!studentInfo) {
                return null;
            }

            const [rows] = await db.query(
                `
                ${buildTuitionSelect()}
                WHERE t.id = ? AND t.student_id = ?
                `,
                [id, studentInfo.id]
            );

            return rows[0];
        }

        return null;
    },

    getRawById: async (id, connection = db) => {
        const [rows] = await connection.query(
            `SELECT id, student_id, semester_id, total_credits, amount, paid_amount, status, due_date
             FROM tuitions
             WHERE id = ?
             LIMIT 1`,
            [id]
        );

        return rows[0];
    },

    studentExists: async (studentId) => {
        const [rows] = await db.query(
            `SELECT id
             FROM student_info
             WHERE id = ?
             LIMIT 1`,
            [studentId]
        );

        return Boolean(rows[0]);
    },

    semesterExists: async (semesterId) => {
        const [rows] = await db.query(
            `SELECT id
             FROM semesters
             WHERE id = ?
             LIMIT 1`,
            [semesterId]
        );

        return Boolean(rows[0]);
    },

    duplicateStudentSemesterExists: async (studentId, semesterId, excludeId = null) => {
        const params = [studentId, semesterId];
        let query = `
            SELECT id
            FROM tuitions
            WHERE student_id = ?
              AND semester_id = ?
        `;

        if (excludeId) {
            query += " AND id <> ?";
            params.push(Number(excludeId));
        }

        query += " LIMIT 1";
        const [rows] = await db.query(query, params);
        return Boolean(rows[0]);
    },

    getSemesterEnrollmentTuitionRows: async (studentId, semesterId, connection = db) => {
        const [rows] = await connection.query(
            `SELECT
                e.id AS enrollment_id,
                cs.subject_id,
                s.name AS subject_name,
                s.credits,
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM enrollments previous_e
                        INNER JOIN course_sections previous_cs ON previous_e.course_section_id = previous_cs.id
                        INNER JOIN grades previous_g ON previous_g.enrollment_id = previous_e.id
                        WHERE previous_e.student_id = e.student_id
                          AND previous_cs.subject_id = cs.subject_id
                          AND previous_e.id < e.id
                          AND previous_g.total_score >= 5
                          AND previous_g.total_score <= 8
                    ) THEN 'hoc_cai_thien'
                    WHEN EXISTS (
                        SELECT 1
                        FROM enrollments previous_e
                        INNER JOIN course_sections previous_cs ON previous_e.course_section_id = previous_cs.id
                        INNER JOIN grades previous_g ON previous_g.enrollment_id = previous_e.id
                        WHERE previous_e.student_id = e.student_id
                          AND previous_cs.subject_id = cs.subject_id
                          AND previous_e.id < e.id
                          AND previous_g.total_score < 5
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM enrollments previous_e
                        INNER JOIN course_sections previous_cs ON previous_e.course_section_id = previous_cs.id
                        INNER JOIN grades previous_g ON previous_g.enrollment_id = previous_e.id
                        WHERE previous_e.student_id = e.student_id
                          AND previous_cs.subject_id = cs.subject_id
                          AND previous_e.id < e.id
                          AND previous_g.total_score >= 5
                    ) THEN 'hoc_lai'
                    ELSE 'hoc_di'
                END AS enrollment_type
             FROM enrollments e
             INNER JOIN course_sections cs ON e.course_section_id = cs.id
             INNER JOIN subjects s ON cs.subject_id = s.id
             WHERE e.student_id = ?
               AND cs.semester_id = ?
               AND LOWER(COALESCE(e.status, '')) NOT IN (${buildInactiveStatusPlaceholders()})
             ORDER BY e.id ASC`,
            [studentId, semesterId, ...INACTIVE_ENROLLMENT_STATUSES]
        );

        return rows;
    },

    calculateTuitionForStudentSemester: async (studentId, semesterId, connection = db) => {
        const rows = await tuitionsModel.getSemesterEnrollmentTuitionRows(studentId, semesterId, connection);
        return {
            ...calculateTuitionAmountFromRows(rows),
            enrollments: rows
        };
    },

    updatePaidAmountAndStatus: async (tuitionId, connection = db) => {
        const [paymentRows] = await connection.query(
            `SELECT COALESCE(SUM(amount), 0) AS paid_amount
             FROM tuition_payments
             WHERE tuition_id = ?`,
            [tuitionId]
        );

        const paidAmount = Number(paymentRows[0]?.paid_amount || 0);
        const tuition = await tuitionsModel.getRawById(tuitionId, connection);

        if (!tuition) {
            return null;
        }

        let nextStatus = "unpaid";

        if (paidAmount >= Number(tuition.amount) && Number(tuition.amount) > 0) {
            nextStatus = "paid";
        } else if (paidAmount > 0) {
            nextStatus = "partial";
        }

        await connection.query(
            `UPDATE tuitions
             SET paid_amount = ?, status = ?
             WHERE id = ?`,
            [paidAmount, nextStatus, tuitionId]
        );

        return {
            paid_amount: paidAmount,
            status: nextStatus
        };
    },

    syncAllPaidAmountsAndStatuses: async (connection = db) => {
        const [result] = await connection.query(
            `UPDATE tuitions t
             LEFT JOIN (
                 SELECT tuition_id, COALESCE(SUM(amount), 0) AS total_paid
                 FROM tuition_payments
                 GROUP BY tuition_id
             ) payment_summary ON payment_summary.tuition_id = t.id
             SET
                t.paid_amount = COALESCE(payment_summary.total_paid, 0),
                t.status = CASE
                    WHEN COALESCE(payment_summary.total_paid, 0) >= t.amount AND t.amount > 0 THEN 'paid'
                    WHEN COALESCE(payment_summary.total_paid, 0) > 0 THEN 'partial'
                    ELSE 'unpaid'
                END`
        );

        return result;
    },

    syncCalculatedAmountsAndStatuses: async (connection = db) => {
        const [tuitions] = await connection.query(
            `SELECT id, student_id, semester_id, due_date
             FROM tuitions
             ORDER BY id ASC`
        );

        let affectedRows = 0;

        for (const tuition of tuitions) {
            const calculated = await tuitionsModel.calculateTuitionForStudentSemester(
                tuition.student_id,
                tuition.semester_id,
                connection
            );
            const [paymentRows] = await connection.query(
                `SELECT COALESCE(SUM(amount), 0) AS paid_amount
                 FROM tuition_payments
                 WHERE tuition_id = ?`,
                [tuition.id]
            );
            const paidAmount = Number(paymentRows[0]?.paid_amount || 0);
            const nextStatus = normalizeTuitionStatus(calculated.amount, paidAmount);

            const [updateResult] = await connection.query(
                `UPDATE tuitions
                 SET total_credits = ?, amount = ?, paid_amount = ?, status = ?
                 WHERE id = ?`,
                [
                    calculated.total_credits,
                    calculated.amount,
                    paidAmount,
                    nextStatus,
                    tuition.id
                ]
            );

            affectedRows += Number(updateResult.affectedRows || 0);
        }

        return { affectedRows };
    },

    create: async (data) => {
        const {
            student_id,
            semester_id,
            total_credits,
            amount,
            paid_amount,
            status,
            due_date
        } = data;

        const calculated = await tuitionsModel.calculateTuitionForStudentSemester(student_id, semester_id);
        const normalizedPaidAmount = Number(paid_amount ?? 0);
        const normalizedAmount = Number(amount ?? calculated.amount);
        const normalizedCredits = Number(total_credits ?? calculated.total_credits);

        const [result] = await db.query(
            `INSERT INTO tuitions
             (student_id, semester_id, total_credits, amount, paid_amount, status, due_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                student_id,
                semester_id,
                normalizedCredits,
                normalizedAmount,
                normalizedPaidAmount,
                status || normalizeTuitionStatus(normalizedAmount, normalizedPaidAmount),
                due_date || null
            ]
        );

        return result;
    },

    update: async (id, data) => {
        const {
            student_id,
            semester_id,
            total_credits,
            amount,
            paid_amount,
            status,
            due_date
        } = data;

        const calculated = await tuitionsModel.calculateTuitionForStudentSemester(student_id, semester_id);
        const normalizedPaidAmount = Number(paid_amount ?? 0);
        const normalizedAmount = Number(amount ?? calculated.amount);
        const normalizedCredits = Number(total_credits ?? calculated.total_credits);

        const [result] = await db.query(
            `UPDATE tuitions
             SET student_id = ?, semester_id = ?, total_credits = ?, amount = ?, paid_amount = ?, status = ?, due_date = ?
             WHERE id = ?`,
            [
                student_id,
                semester_id,
                normalizedCredits,
                normalizedAmount,
                normalizedPaidAmount,
                status || normalizeTuitionStatus(normalizedAmount, normalizedPaidAmount),
                due_date || null,
                id
            ]
        );

        return result;
    },

    remove: async (id) => {
        const [result] = await db.query(
            "DELETE FROM tuitions WHERE id = ?",
            [id]
        );

        return result;
    }
};

module.exports = tuitionsModel;
