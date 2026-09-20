const reportsModel = require("../models/reports.model");
const { isValidDateString, isPositiveInteger } = require("../utils/validation");

const validateFinancialReportFilters = (filters) => {
    const integerFilterNames = ["semester_id", "class_id", "faculty_id"];

    for (const filterName of integerFilterNames) {
        if (filters[filterName] && !isPositiveInteger(filters[filterName])) {
            return `${filterName} phai la so nguyen duong`;
        }
    }

    if (filters.date_from && !isValidDateString(filters.date_from)) {
        return "date_from khong hop le, can theo dinh dang YYYY-MM-DD";
    }

    if (filters.date_to && !isValidDateString(filters.date_to)) {
        return "date_to khong hop le, can theo dinh dang YYYY-MM-DD";
    }

    if (filters.date_from && filters.date_to && filters.date_from > filters.date_to) {
        return "date_from phai nho hon hoac bang date_to";
    }

    return null;
};

const normalizeFinancialReportFilters = (filters) => ({
    ...filters,
    date_from: filters.date_from || filters.start_date || null,
    date_to: filters.date_to || filters.end_date || null
});

exports.getAcademicWarnings = async (req, res) => {
    try {
        const data = await reportsModel.getAcademicWarnings(req.query);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach canh bao hoc vu",
            error: error.message
        });
    }
};

exports.getTuitionDebts = async (req, res) => {
    try {
        const data = await reportsModel.getTuitionDebts(req.query);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay bao cao no hoc phi",
            error: error.message
        });
    }
};

exports.getFinancialReport = async (req, res) => {
    try {
        const filters = normalizeFinancialReportFilters(req.query);
        const validationError = validateFinancialReportFilters(filters);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const data = await reportsModel.getFinancialReport(filters);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay bao cao tai chinh",
            error: error.message
        });
    }
};
