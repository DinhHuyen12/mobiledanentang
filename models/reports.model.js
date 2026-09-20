const db = require("../config/db");

const GRADE_POINTS = {
    A: 4.0,
    "B+": 3.5,
    B: 3.0,
    "C+": 2.5,
    C: 2.0,
    "D+": 1.5,
    D: 1.0,
    F: 0
};
const PASSING_SCORE = 5;

const normalizeMoney = (value) => Number(value || 0);

const withFinancialAliases = (row) => {
    const billedAmount = normalizeMoney(row.billed_amount);
    const paidAmount = normalizeMoney(row.paid_amount);
    const outstandingAmount = normalizeMoney(row.outstanding_amount);
    const tuitionCount = Number(row.tuition_count || 0);

    return {
        ...row,
        invoice_count: tuitionCount,
        total_billed_amount: billedAmount,
        total_amount: billedAmount,
        total_receivable: billedAmount,
        receivable_amount: billedAmount,
        paid_amount: paidAmount,
        total_paid_amount: paidAmount,
        total_paid: paidAmount,
        collected_amount: paidAmount,
        total_collected_amount: paidAmount,
        total_collected: paidAmount,
        outstanding_amount: outstandingAmount,
        remaining_amount: outstandingAmount,
        debt_amount: outstandingAmount,
        total_debt_amount: outstandingAmount,
        total_debt: outstandingAmount
    };
};

const buildFinancialTuitionScope = (filters = {}) => {
    const conditions = [];
    const params = [];

    if (filters.semester_id) {
        conditions.push("t.semester_id = ?");
        params.push(Number(filters.semester_id));
    }

    if (filters.class_id) {
        conditions.push("si.class_id = ?");
        params.push(Number(filters.class_id));
    }

    if (filters.faculty_id) {
        conditions.push("c.faculty_id = ?");
        params.push(Number(filters.faculty_id));
    }

    return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
        params
    };
};

const buildFinancialPaymentScope = (filters = {}) => {
    const conditions = [];
    const params = [];

    if (filters.semester_id) {
        conditions.push("t.semester_id = ?");
        params.push(Number(filters.semester_id));
    }

    if (filters.class_id) {
        conditions.push("si.class_id = ?");
        params.push(Number(filters.class_id));
    }

    if (filters.faculty_id) {
        conditions.push("c.faculty_id = ?");
        params.push(Number(filters.faculty_id));
    }

    if (filters.date_from) {
        conditions.push("tp.payment_date >= ?");
        params.push(filters.date_from);
    }

    if (filters.date_to) {
        conditions.push("tp.payment_date <= ?");
        params.push(filters.date_to);
    }

    return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
        params
    };
};

const buildAcademicRows = async (classId = null) => {
    const params = [];
    let whereClause = "";

    if (classId) {
        whereClause = "WHERE si.class_id = ?";
        params.push(Number(classId));
    }

    const [rows] = await db.query(
        `SELECT
            si.id AS student_id,
            si.class_id,
            c.name AS class_name,
            u.full_name AS student_name,
            u.email AS student_email,
            s.id AS subject_id,
            s.name AS subject_name,
            s.credits,
            g.total_score,
            g.letter_grade
         FROM student_info si
         INNER JOIN users u ON si.user_id = u.id
         LEFT JOIN classes c ON si.class_id = c.id
         INNER JOIN enrollments e ON e.student_id = si.id
         INNER JOIN course_sections cs ON e.course_section_id = cs.id
         INNER JOIN subjects s ON cs.subject_id = s.id
         INNER JOIN grades g ON g.enrollment_id = e.id
         ${whereClause}
         ORDER BY si.id ASC, s.id ASC, g.total_score DESC, g.id DESC`,
        params
    );

    return rows;
};

const buildAcademicWarnings = (rows, warningThreshold) => {
    const studentMap = new Map();

    for (const row of rows) {
        const studentId = Number(row.student_id);

        if (!studentMap.has(studentId)) {
            studentMap.set(studentId, {
                student_id: studentId,
                student_name: row.student_name,
                student_email: row.student_email,
                class_id: row.class_id,
                class_name: row.class_name,
                bestBySubject: new Map()
            });
        }

        const student = studentMap.get(studentId);
        const subjectId = Number(row.subject_id);
        const currentBest = student.bestBySubject.get(subjectId);

        if (!currentBest || Number(row.total_score) > Number(currentBest.total_score)) {
            student.bestBySubject.set(subjectId, row);
        }
    }

    return Array.from(studentMap.values())
        .map((student) => {
            const bestAttempts = Array.from(student.bestBySubject.values());
            const attemptedCredits = bestAttempts.reduce((sum, item) => sum + Number(item.credits || 0), 0);
            const earnedCredits = bestAttempts
                .filter((item) => Number(item.total_score) >= PASSING_SCORE)
                .reduce((sum, item) => sum + Number(item.credits || 0), 0);
            const totalQualityPoints = bestAttempts.reduce((sum, item) => {
                return sum + (Number(item.credits || 0) * (GRADE_POINTS[item.letter_grade] ?? 0));
            }, 0);
            const cumulativeGpa = attemptedCredits > 0
                ? Math.round((totalQualityPoints / attemptedCredits) * 100) / 100
                : 0;

            return {
                student_id: student.student_id,
                student_name: student.student_name,
                student_email: student.student_email,
                class_id: student.class_id,
                class_name: student.class_name,
                attempted_credits: attemptedCredits,
                earned_credits: earnedCredits,
                failed_subjects: bestAttempts.filter((item) => Number(item.total_score) < PASSING_SCORE).length,
                cumulative_gpa: cumulativeGpa,
                warning_level: cumulativeGpa < 1 ? "nghiem_trong" : "canh_bao"
            };
        })
        .filter((student) => student.cumulative_gpa < warningThreshold)
        .sort((left, right) => left.cumulative_gpa - right.cumulative_gpa || left.student_id - right.student_id);
};

const reportsModel = {
    getAcademicWarnings: async (filters = {}) => {
        const warningThreshold = Number(filters.warning_threshold ?? 2);
        const classId = filters.class_id ? Number(filters.class_id) : null;
        const rows = await buildAcademicRows(classId);
        return buildAcademicWarnings(rows, warningThreshold);
    },

    getTuitionDebts: async (filters = {}) => {
        const params = [];
        const conditions = ["GREATEST(t.amount - COALESCE(payment_summary.paid_amount, 0), 0) > 0"];

        if (filters.semester_id) {
            conditions.push("t.semester_id = ?");
            params.push(Number(filters.semester_id));
        }

        if (filters.class_id) {
            conditions.push("si.class_id = ?");
            params.push(Number(filters.class_id));
        }

        const [rows] = await db.query(
            `SELECT
                t.id AS tuition_id,
                t.student_id,
                u.full_name AS student_name,
                u.email AS student_email,
                si.class_id,
                c.name AS class_name,
                t.semester_id,
                sem.name AS semester_name,
                t.amount,
                COALESCE(payment_summary.paid_amount, 0) AS paid_amount,
                GREATEST(t.amount - COALESCE(payment_summary.paid_amount, 0), 0) AS remaining_amount,
                t.status,
                t.due_date
             FROM tuitions t
             INNER JOIN student_info si ON t.student_id = si.id
             INNER JOIN users u ON si.user_id = u.id
             LEFT JOIN classes c ON si.class_id = c.id
             LEFT JOIN semesters sem ON t.semester_id = sem.id
             LEFT JOIN (
                SELECT tuition_id, SUM(amount) AS paid_amount
                FROM tuition_payments
                GROUP BY tuition_id
             ) payment_summary ON payment_summary.tuition_id = t.id
             WHERE ${conditions.join(" AND ")}
             ORDER BY remaining_amount DESC, t.due_date ASC, t.id ASC`,
            params
        );

        return rows;
    },

    getFinancialReport: async (filters = {}) => {
        const tuitionScope = buildFinancialTuitionScope(filters);
        const paymentScope = buildFinancialPaymentScope(filters);
        const scopedTuitionJoin = `
            FROM tuitions t
            INNER JOIN student_info si ON t.student_id = si.id
            INNER JOIN users u ON si.user_id = u.id
            LEFT JOIN classes c ON si.class_id = c.id
            LEFT JOIN faculties f ON c.faculty_id = f.id
            LEFT JOIN semesters sem ON t.semester_id = sem.id
        `;

        const [summaryRows] = await db.query(
            `SELECT
                COUNT(t.id) AS tuition_count,
                COUNT(DISTINCT t.student_id) AS student_count,
                COALESCE(SUM(t.total_credits), 0) AS total_credits,
                COALESCE(SUM(t.amount), 0) AS billed_amount,
                COALESCE(SUM(payment_summary.paid_amount), 0) AS paid_amount,
                COALESCE(SUM(GREATEST(t.amount - COALESCE(payment_summary.paid_amount, 0), 0)), 0) AS outstanding_amount,
                SUM(CASE WHEN COALESCE(payment_summary.paid_amount, 0) >= t.amount AND t.amount > 0 THEN 1 ELSE 0 END) AS paid_tuition_count,
                SUM(CASE WHEN COALESCE(payment_summary.paid_amount, 0) > 0
                           AND COALESCE(payment_summary.paid_amount, 0) < t.amount THEN 1 ELSE 0 END) AS partial_tuition_count,
                SUM(CASE WHEN COALESCE(payment_summary.paid_amount, 0) = 0 THEN 1 ELSE 0 END) AS unpaid_tuition_count
             ${scopedTuitionJoin}
             LEFT JOIN (
                SELECT tuition_id, SUM(amount) AS paid_amount
                FROM tuition_payments
                GROUP BY tuition_id
             ) payment_summary ON payment_summary.tuition_id = t.id
             ${tuitionScope.whereClause}`,
            tuitionScope.params
        );

        const [collectionRows] = await db.query(
            `SELECT
                COUNT(tp.id) AS payment_count,
                COALESCE(SUM(tp.amount), 0) AS collected_amount
             ${scopedTuitionJoin}
             INNER JOIN tuition_payments tp ON tp.tuition_id = t.id
             ${paymentScope.whereClause}`,
            paymentScope.params
        );

        const [bySemester] = await db.query(
            `SELECT
                t.semester_id,
                sem.name AS semester_name,
                COUNT(t.id) AS tuition_count,
                COUNT(DISTINCT t.student_id) AS student_count,
                COALESCE(SUM(t.amount), 0) AS billed_amount,
                COALESCE(SUM(payment_summary.paid_amount), 0) AS paid_amount,
                COALESCE(SUM(GREATEST(t.amount - COALESCE(payment_summary.paid_amount, 0), 0)), 0) AS outstanding_amount
             ${scopedTuitionJoin}
             LEFT JOIN (
                SELECT tuition_id, SUM(amount) AS paid_amount
                FROM tuition_payments
                GROUP BY tuition_id
             ) payment_summary ON payment_summary.tuition_id = t.id
             ${tuitionScope.whereClause}
             GROUP BY t.semester_id, sem.name
             ORDER BY t.semester_id ASC`,
            tuitionScope.params
        );

        const [byClass] = await db.query(
            `SELECT
                si.class_id,
                c.name AS class_name,
                c.faculty_id,
                f.name AS faculty_name,
                COUNT(t.id) AS tuition_count,
                COUNT(DISTINCT t.student_id) AS student_count,
                COALESCE(SUM(t.amount), 0) AS billed_amount,
                COALESCE(SUM(payment_summary.paid_amount), 0) AS paid_amount,
                COALESCE(SUM(GREATEST(t.amount - COALESCE(payment_summary.paid_amount, 0), 0)), 0) AS outstanding_amount
             ${scopedTuitionJoin}
             LEFT JOIN (
                SELECT tuition_id, SUM(amount) AS paid_amount
                FROM tuition_payments
                GROUP BY tuition_id
             ) payment_summary ON payment_summary.tuition_id = t.id
             ${tuitionScope.whereClause}
             GROUP BY si.class_id, c.name, c.faculty_id, f.name
             ORDER BY outstanding_amount DESC, c.name ASC`,
            tuitionScope.params
        );

        const [byPaymentMethod] = await db.query(
            `SELECT
                COALESCE(tp.payment_method, 'unknown') AS payment_method,
                COUNT(tp.id) AS payment_count,
                COALESCE(SUM(tp.amount), 0) AS collected_amount
             ${scopedTuitionJoin}
             INNER JOIN tuition_payments tp ON tp.tuition_id = t.id
             ${paymentScope.whereClause}
             GROUP BY COALESCE(tp.payment_method, 'unknown')
             ORDER BY collected_amount DESC, payment_method ASC`,
            paymentScope.params
        );

        const [recentPayments] = await db.query(
            `SELECT
                tp.id AS payment_id,
                tp.tuition_id,
                tp.payment_date,
                tp.amount,
                tp.payment_method,
                tp.note,
                t.student_id,
                u.full_name AS student_name,
                u.email AS student_email,
                si.class_id,
                c.name AS class_name,
                t.semester_id,
                sem.name AS semester_name
             ${scopedTuitionJoin}
             INNER JOIN tuition_payments tp ON tp.tuition_id = t.id
             ${paymentScope.whereClause}
             ORDER BY tp.payment_date DESC, tp.id DESC
             LIMIT 20`,
            paymentScope.params
        );

        const summary = summaryRows[0] || {};
        const collection = collectionRows[0] || {};

        const billedAmount = normalizeMoney(summary.billed_amount);
        const paidAmount = normalizeMoney(summary.paid_amount);
        const outstandingAmount = normalizeMoney(summary.outstanding_amount);
        const collectedAmount = normalizeMoney(collection.collected_amount);
        const paidTuitionCount = Number(summary.paid_tuition_count || 0);
        const partialTuitionCount = Number(summary.partial_tuition_count || 0);
        const unpaidTuitionCount = Number(summary.unpaid_tuition_count || 0);

        return {
            filters: {
                semester_id: filters.semester_id ? Number(filters.semester_id) : null,
                class_id: filters.class_id ? Number(filters.class_id) : null,
                faculty_id: filters.faculty_id ? Number(filters.faculty_id) : null,
                date_from: filters.date_from || null,
                date_to: filters.date_to || null
            },
            summary: {
                tuition_count: Number(summary.tuition_count || 0),
                invoice_count: Number(summary.tuition_count || 0),
                student_count: Number(summary.student_count || 0),
                total_credits: Number(summary.total_credits || 0),
                billed_amount: billedAmount,
                total_billed_amount: billedAmount,
                total_amount: billedAmount,
                total_receivable: billedAmount,
                receivable_amount: billedAmount,
                paid_amount: paidAmount,
                total_paid_amount: paidAmount,
                total_paid: paidAmount,
                collected_amount: collectedAmount,
                total_collected_amount: collectedAmount,
                total_collected: collectedAmount,
                outstanding_amount: outstandingAmount,
                remaining_amount: outstandingAmount,
                debt_amount: outstandingAmount,
                total_debt_amount: outstandingAmount,
                total_debt: outstandingAmount,
                payment_count: Number(collection.payment_count || 0),
                paid_tuition_count: paidTuitionCount,
                paid_invoice_count: paidTuitionCount,
                paid_count: paidTuitionCount,
                partial_tuition_count: partialTuitionCount,
                partial_invoice_count: partialTuitionCount,
                partial_count: partialTuitionCount,
                unpaid_tuition_count: unpaidTuitionCount,
                unpaid_invoice_count: unpaidTuitionCount,
                unpaid_count: unpaidTuitionCount
            },
            by_semester: bySemester.map(withFinancialAliases),
            by_class: byClass.map(withFinancialAliases),
            by_payment_method: byPaymentMethod,
            recent_payments: recentPayments
        };
    }
};

module.exports = reportsModel;
