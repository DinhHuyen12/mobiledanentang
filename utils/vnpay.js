const crypto = require("crypto");

const VNPAY_TZ_OFFSET_MINUTES = 7 * 60;

const sortObject = (input) => {
    const sorted = {};

    Object.keys(input)
        .sort()
        .forEach((key) => {
            if (input[key] !== undefined && input[key] !== null && input[key] !== "") {
                sorted[key] = input[key];
            }
        });

    return sorted;
};

const sanitizeVnpParams = (input = {}) => {
    const payload = { ...input };

    delete payload.vnp_SecureHash;
    delete payload.vnp_SecureHashType;

    return payload;
};

const formatDate = (date = new Date()) => {
    const localDate = new Date(date.getTime() + (VNPAY_TZ_OFFSET_MINUTES + date.getTimezoneOffset()) * 60000);
    const yyyy = localDate.getFullYear();
    const MM = String(localDate.getMonth() + 1).padStart(2, "0");
    const dd = String(localDate.getDate()).padStart(2, "0");
    const HH = String(localDate.getHours()).padStart(2, "0");
    const mm = String(localDate.getMinutes()).padStart(2, "0");
    const ss = String(localDate.getSeconds()).padStart(2, "0");

    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
};

const createSecureHash = (params, secret) => {
    const signData = new URLSearchParams(sortObject(sanitizeVnpParams(params))).toString();

    return crypto
        .createHmac("sha512", secret)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");
};

const buildPaymentUrl = (baseUrl, params, secret) => {
    const sortedParams = sortObject(sanitizeVnpParams(params));
    const secureHash = createSecureHash(sortedParams, secret);
    const query = new URLSearchParams({
        ...sortedParams,
        vnp_SecureHash: secureHash
    }).toString();

    return `${baseUrl}?${query}`;
};

const verifyReturnQuery = (query, secret) => {
    const payload = { ...query };
    const receivedHash = payload.vnp_SecureHash;

    delete payload.vnp_SecureHash;
    delete payload.vnp_SecureHashType;

    const expectedHash = createSecureHash(payload, secret);

    return receivedHash === expectedHash;
};

const getClientIp = (req) => {
    const forwardedFor = req.headers["x-forwarded-for"];

    if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
        return forwardedFor.split(",")[0].trim();
    }

    return (
        req.headers["x-real-ip"] ||
        req.socket?.remoteAddress ||
        req.ip ||
        "127.0.0.1"
    );
};

module.exports = {
    buildPaymentUrl,
    createSecureHash,
    formatDate,
    getClientIp,
    verifyReturnQuery
};
