const createAppError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isValidDateString = (value) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

const isOneOf = (value, allowedValues) => allowedValues.includes(normalizeStatus(value));

const TUITION_STATUSES = ["unpaid", "partial", "paid"];
const SCHOLARSHIP_STATUSES = ["active", "inactive"];
const SCHOLARSHIP_AWARD_STATUSES = ["approved", "pending", "rejected", "cancelled", "canceled"];
const DISCIPLINARY_LEVELS = ["nhac_nho", "canh_cao", "dinh_chi", "buoc_thoi_hoc"];
const DISCIPLINARY_STATUSES = ["active", "resolved", "cancelled", "canceled"];
const ENROLLMENT_STATUSES = ["pending", "active", "completed", "rejected", "cancelled", "canceled", "dropped"];
const PAYMENT_METHODS = ["cash", "bank", "vnpay", "mock_vnpay"];

module.exports = {
    createAppError,
    isValidDateString,
    isPositiveInteger,
    normalizeStatus,
    isOneOf,
    TUITION_STATUSES,
    SCHOLARSHIP_STATUSES,
    SCHOLARSHIP_AWARD_STATUSES,
    DISCIPLINARY_LEVELS,
    DISCIPLINARY_STATUSES,
    ENROLLMENT_STATUSES,
    PAYMENT_METHODS
};
