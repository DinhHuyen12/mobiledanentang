const crypto = require("crypto");
const tuitionsModel = require("../models/tuitions.model");
const tuitionPaymentsModel = require("../models/tuitionPayments.model");
const { buildPaymentUrl, formatDate, getClientIp, verifyReturnQuery } = require("../utils/vnpay");
const {
    isValidDateString,
    isPositiveInteger,
    isOneOf,
    TUITION_STATUSES
} = require("../utils/validation");

const PAYMENT_METHODS = [
    {
        code: "cash",
        name: "Tien mat",
        description: "Thanh toan truc tiep tai quay"
    },
    {
        code: "bank",
        name: "Chuyen khoan",
        description: "Thanh toan bang chuyen khoan ngan hang"
    },
    {
        code: "vnpay",
        name: "VNPay",
        description: "Thanh toan online qua cong VNPay"
    },
    {
        code: "mock_vnpay",
        name: "VNPay Demo",
        description: "Mo phong thanh toan online khi chua co tai khoan merchant"
    }
];

const PAYMENT_METHOD_CODES = PAYMENT_METHODS.map((method) => method.code);

const buildVnpTxnRef = (tuitionId, userId) => {
    const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `TUITION${tuitionId}U${userId}${Date.now()}${randomPart}`.slice(0, 100);
};

const VNP_ORDER_INFO_PREFIX = "Thanh toan hoc phi";
const VNP_ORDER_INFO_META_MARKER = "|meta:";
const VNP_ORDER_INFO_MAX_LENGTH = 255;

const buildVnpOrderInfo = (tuitionId, amount, metadata = {}) => {
    const baseInfo = `${VNP_ORDER_INFO_PREFIX} ${tuitionId} so tien ${amount}`;
    const cleanedMetadata = {};

    if (metadata.payment_method) {
        cleanedMetadata.payment_method = String(metadata.payment_method).trim();
    }

    if (metadata.note) {
        cleanedMetadata.note = String(metadata.note).trim();
    }

    if (!cleanedMetadata.payment_method && !cleanedMetadata.note) {
        return baseInfo;
    }

    const encodedMetadata = Buffer.from(JSON.stringify(cleanedMetadata), "utf8").toString("base64url");
    const orderInfoWithMetadata = `${baseInfo}${VNP_ORDER_INFO_META_MARKER}${encodedMetadata}`;

    if (orderInfoWithMetadata.length <= VNP_ORDER_INFO_MAX_LENGTH) {
        return orderInfoWithMetadata;
    }

    return baseInfo;
};

const extractMetadataFromOrderInfo = (orderInfo) => {
    const normalizedOrderInfo = String(orderInfo || "");
    const markerIndex = normalizedOrderInfo.indexOf(VNP_ORDER_INFO_META_MARKER);

    if (markerIndex === -1) {
        return {
            baseOrderInfo: normalizedOrderInfo,
            payment_method: null,
            note: null
        };
    }

    const baseOrderInfo = normalizedOrderInfo.slice(0, markerIndex);
    const encodedMetadata = normalizedOrderInfo.slice(markerIndex + VNP_ORDER_INFO_META_MARKER.length);

    try {
        const decodedMetadata = JSON.parse(Buffer.from(encodedMetadata, "base64url").toString("utf8"));

        return {
            baseOrderInfo,
            payment_method: decodedMetadata.payment_method ? String(decodedMetadata.payment_method).trim() : null,
            note: decodedMetadata.note ? String(decodedMetadata.note).trim() : null
        };
    } catch (error) {
        return {
            baseOrderInfo,
            payment_method: null,
            note: null
        };
    }
};

const getVnpayConfig = () => {
    const config = {
        tmnCode: process.env.VNPAY_TMN_CODE,
        hashSecret: process.env.VNPAY_HASH_SECRET,
        payUrl: process.env.VNPAY_PAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        returnUrl: process.env.VNPAY_RETURN_URL
    };

    if (!config.tmnCode || !config.hashSecret || !config.returnUrl) {
        return null;
    }

    return config;
};

const buildAvailablePaymentMethods = () => {
    const hasRealVnpay = Boolean(getVnpayConfig());
    const isMockMode = process.env.VNPAY_MODE === "mock";

    return PAYMENT_METHODS.filter((method) => {
        if (method.code === "vnpay") {
            return hasRealVnpay || isMockMode;
        }

        if (method.code === "mock_vnpay") {
            return !hasRealVnpay && !isMockMode;
        }

        return true;
    });
};

const getPublicBaseUrl = (req) => {
    const configuredBaseUrl = process.env.APP_BASE_URL;

    if (configuredBaseUrl) {
        return configuredBaseUrl.replace(/\/+$/, "");
    }

    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.get("host");

    return `${protocol}://${host}`;
};

const getFrontendBaseUrl = () => {
    const configuredFrontendBaseUrl = process.env.FRONTEND_BASE_URL || process.env.APP_BASE_URL;

    if (configuredFrontendBaseUrl) {
        return configuredFrontendBaseUrl.replace(/\/+$/, "");
    }

    return "http://localhost:3000";
};

const buildFrontendUrl = (path, params = {}) => {
    const frontendBaseUrl = getFrontendBaseUrl();
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, String(value));
        }
    });

    const queryString = query.toString();
    return `${frontendBaseUrl}${path}${queryString ? `?${queryString}` : ""}`;
};

exports.getAllTuitions = async (req, res) => {
    try {
        const data = await tuitionsModel.getAllForUser(req.user);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay danh sach hoc phi",
            error: error.message
        });
    }
};

exports.getTuitionById = async (req, res) => {
    try {
        const data = await tuitionsModel.getByIdForUser(req.params.id, req.user);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay hoc phi"
            });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay hoc phi",
            error: error.message
        });
    }
};

exports.getTuitionPayments = async (req, res) => {
    try {
        const tuition = await tuitionsModel.getByIdForUser(req.params.id, req.user);

        if (!tuition) {
            return res.status(404).json({
                message: "Khong tim thay hoc phi"
            });
        }

        const payments = await tuitionPaymentsModel.getByTuitionIdForUser(req.params.id, req.user);

        return res.json({
            tuition,
            payments
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay lich su thanh toan hoc phi",
            error: error.message
        });
    }
};

exports.getPaymentMethods = async (req, res) => {
    try {
        const tuition = await tuitionsModel.getByIdForUser(req.params.id, req.user);

        if (!tuition) {
            return res.status(404).json({
                message: "Khong tim thay hoc phi"
            });
        }

        return res.json({
            tuition: {
                id: tuition.id,
                amount: tuition.amount,
                paid_amount: tuition.paid_amount,
                remaining_amount: tuition.remaining_amount,
                status: tuition.status
            },
            methods: buildAvailablePaymentMethods()
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi lay phuong thuc thanh toan",
            error: error.message
        });
    }
};

exports.createMockVnpayPayment = async (req, res) => {
    try {
        const tuition = await tuitionsModel.getByIdForUser(req.params.id, req.user);

        if (!tuition) {
            return res.status(404).json({
                message: "Khong tim thay hoc phi hoac ban khong co quyen thanh toan"
            });
        }

        const requestedAmount = Number(req.body.amount ?? tuition.remaining_amount);

        if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
            return res.status(400).json({
                message: "So tien thanh toan phai lon hon 0"
            });
        }

        if (requestedAmount > Number(tuition.remaining_amount)) {
            return res.status(409).json({
                message: "So tien thanh toan vuot qua so tien con lai"
            });
        }

        const mockTxnRef = `MOCKVNPAY${buildVnpTxnRef(tuition.id, req.user.id)}`;
        const normalizedPaymentDate = req.body.payment_date || new Date().toISOString().slice(0, 10);

        const result = await tuitionPaymentsModel.create({
            tuition_id: Number(req.params.id),
            payment_date: normalizedPaymentDate,
            amount: requestedAmount,
            payment_method: "mock_vnpay",
            note: req.body.note || `MOCK_VNPAY_TXN_REF:${mockTxnRef}`
        });

        const updatedTuition = await tuitionsModel.getByIdForUser(req.params.id, req.user);
        const payments = await tuitionPaymentsModel.getByTuitionIdForUser(req.params.id, req.user);

        return res.status(201).json({
            message: "Thanh toan mock VNPAY thanh cong",
            payment_id: result.insertId,
            txn_ref: mockTxnRef,
            tuition: updatedTuition,
            payments
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            message: statusCode === 500 ? "Loi thanh toan mock VNPAY" : error.message,
            error: statusCode === 500 ? error.message : undefined
        });
    }
};

exports.payTuition = async (req, res) => {
    try {
        const tuition = await tuitionsModel.getByIdForUser(req.params.id, req.user);

        if (!tuition) {
            return res.status(404).json({
                message: "Khong tim thay hoc phi hoac ban khong co quyen thanh toan"
            });
        }

        const { amount, payment_date, payment_method, note } = req.body;

        if (amount == null) {
            return res.status(400).json({
                message: "Thieu amount"
            });
        }

        if (payment_method && !isOneOf(payment_method, PAYMENT_METHOD_CODES)) {
            return res.status(400).json({
                message: "payment_method khong hop le"
            });
        }

        const normalizedPaymentDate = payment_date || new Date().toISOString().slice(0, 10);

        if (!isValidDateString(normalizedPaymentDate)) {
            return res.status(400).json({
                message: "payment_date khong hop le, can theo dinh dang YYYY-MM-DD"
            });
        }

        const result = await tuitionPaymentsModel.create({
            tuition_id: Number(req.params.id),
            payment_date: normalizedPaymentDate,
            amount,
            payment_method,
            note
        });

        const updatedTuition = await tuitionsModel.getByIdForUser(req.params.id, req.user);
        const payments = await tuitionPaymentsModel.getByTuitionIdForUser(req.params.id, req.user);

        return res.status(201).json({
            message: "Thanh toan hoc phi thanh cong",
            payment_id: result.insertId,
            tuition: updatedTuition,
            payments
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            message: statusCode === 500 ? "Loi thanh toan hoc phi" : error.message,
            error: statusCode === 500 ? error.message : undefined
        });
    }
};

exports.createVnpayPayment = async (req, res) => {
    try {
        const isMockMode = process.env.VNPAY_MODE === "mock";
        const realVnpayConfig = getVnpayConfig();
        const vnpayConfig = realVnpayConfig || (isMockMode
            ? {
                tmnCode: "DEMO",
                hashSecret: process.env.VNPAY_MOCK_HASH_SECRET || "demo_vnpay_secret",
                payUrl: `${getPublicBaseUrl(req)}/api/tuitions/vnpay/mock-gateway`,
                returnUrl: process.env.VNPAY_RETURN_URL || `${getPublicBaseUrl(req)}/api/tuitions/vnpay/return`
            }
            : null);

        if (!vnpayConfig) {
            return res.redirect(302, buildFrontendUrl("/student/tuition/vnpay/result", {
                payment_status: "failed",
                message: "VNPAY chua duoc cau hinh tren server"
            }));
        }

        const tuition = await tuitionsModel.getByIdForUser(req.params.id, req.user);

        if (!tuition) {
            return res.status(404).json({
                message: "Khong tim thay hoc phi hoac ban khong co quyen thanh toan"
            });
        }

        const requestedAmount = Number(req.body.amount ?? tuition.remaining_amount);

        if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
            return res.status(400).json({
                message: "So tien thanh toan phai lon hon 0"
            });
        }

        if (requestedAmount > Number(tuition.remaining_amount)) {
            return res.status(409).json({
                message: "So tien thanh toan vuot qua so tien con lai"
            });
        }

        const txnRef = buildVnpTxnRef(tuition.id, req.user.id);
        const createDate = formatDate();
        const ipAddr = getClientIp(req);
        const requestedPaymentMethod = req.body.payment_method
            ? String(req.body.payment_method).trim()
            : "vnpay";
        const requestedNote = req.body.note
            ? String(req.body.note).trim()
            : null;

        if (!isOneOf(requestedPaymentMethod, PAYMENT_METHOD_CODES)) {
            return res.status(400).json({
                message: "payment_method khong hop le"
            });
        }

        const params = {
            vnp_Version: "2.1.0",
            vnp_Command: "pay",
            vnp_TmnCode: vnpayConfig.tmnCode,
            vnp_Amount: Math.round(requestedAmount * 100),
            vnp_CreateDate: createDate,
            vnp_CurrCode: "VND",
            vnp_IpAddr: ipAddr,
            vnp_Locale: "vn",
            vnp_OrderInfo: buildVnpOrderInfo(tuition.id, requestedAmount, {
                payment_method: requestedPaymentMethod,
                note: requestedNote
            }),
            vnp_OrderType: "other",
            vnp_ReturnUrl: vnpayConfig.returnUrl,
            vnp_TxnRef: txnRef
        };

        if (req.body.bank_code) {
            params.vnp_BankCode = req.body.bank_code;
        }

        const paymentUrl = buildPaymentUrl(vnpayConfig.payUrl, params, vnpayConfig.hashSecret);

        return res.json({
            message: isMockMode && !realVnpayConfig
                ? "Tao URL thanh toan VNPAY demo thanh cong"
                : "Tao URL thanh toan VNPAY thanh cong",
            payment_url: paymentUrl,
            txn_ref: txnRef,
            tuition_id: tuition.id,
            amount: requestedAmount,
            payment_method: requestedPaymentMethod,
            note: requestedNote,
            mode: isMockMode && !realVnpayConfig ? "mock" : "real"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao giao dich VNPAY",
            error: error.message
        });
    }
};

exports.handleMockVnpayGateway = async (req, res) => {
    try {
        if (process.env.VNPAY_MODE !== "mock") {
            return res.status(404).json({
                message: "Mock VNPAY gateway khong duoc bat"
            });
        }

        const returnUrl = process.env.VNPAY_RETURN_URL || `${getPublicBaseUrl(req)}/api/tuitions/vnpay/return`;
        const secret = process.env.VNPAY_MOCK_HASH_SECRET || "demo_vnpay_secret";
        const params = {
            ...req.query,
            vnp_ResponseCode: "00",
            vnp_TransactionStatus: "00",
            vnp_PayDate: formatDate(),
            vnp_TransactionNo: Date.now().toString()
        };
        const redirectUrl = buildPaymentUrl(returnUrl, params, secret);

        return res.redirect(302, redirectUrl);
    } catch (error) {
        return res.status(500).json({
            message: "Loi xu ly mock VNPAY gateway",
            error: error.message
        });
    }
};

exports.handleVnpayReturn = async (req, res) => {
    try {
        const isMockMode = process.env.VNPAY_MODE === "mock";
        const realVnpayConfig = getVnpayConfig();
        const vnpayConfig = realVnpayConfig || (isMockMode
            ? {
                tmnCode: "DEMO",
                hashSecret: process.env.VNPAY_MOCK_HASH_SECRET || "demo_vnpay_secret",
                payUrl: `${getPublicBaseUrl(req)}/api/tuitions/vnpay/mock-gateway`,
                returnUrl: process.env.VNPAY_RETURN_URL || `${getPublicBaseUrl(req)}/api/tuitions/vnpay/return`
            }
            : null);

        if (!vnpayConfig) {
            return res.redirect(302, buildFrontendUrl("/student/tuition/vnpay/result", {
                payment_status: "failed",
                message: "VNPAY chua duoc cau hinh tren server"
            }));
        }

        const isValidSignature = verifyReturnQuery(req.query, vnpayConfig.hashSecret);

        if (!isValidSignature) {
            return res.redirect(302, buildFrontendUrl("/student/tuition/vnpay/result", {
                payment_status: "failed",
                message: "Chu ky VNPAY khong hop le"
            }));
        }

        const responseCode = req.query.vnp_ResponseCode;
        const txnRef = req.query.vnp_TxnRef;
        const amount = Number(req.query.vnp_Amount || 0) / 100;
        const orderInfo = String(req.query.vnp_OrderInfo || "");
        const parsedOrderInfo = extractMetadataFromOrderInfo(orderInfo);
        const tuitionIdMatch = parsedOrderInfo.baseOrderInfo.match(/hoc phi (\d+)/i);
        const tuitionId = tuitionIdMatch ? Number(tuitionIdMatch[1]) : null;

        if (!tuitionId) {
            return res.redirect(302, buildFrontendUrl("/student/tuition/vnpay/result", {
                payment_status: "failed",
                message: "Khong xac dinh duoc hoc phi tu ket qua VNPAY",
                txn_ref: txnRef
            }));
        }

        if (responseCode !== "00") {
            return res.redirect(302, buildFrontendUrl("/student/tuition/vnpay/result", {
                payment_status: "failed",
                message: "Giao dich VNPAY khong thanh cong",
                vnp_ResponseCode: responseCode,
                txn_ref: txnRef,
                tuition_id: tuitionId
            }));
        }

        const existingPayment = await tuitionPaymentsModel.findByVnpTxnRef(txnRef);

        if (!existingPayment) {
            await tuitionPaymentsModel.create({
                tuition_id: tuitionId,
                payment_date: new Date().toISOString().slice(0, 10),
                amount,
                payment_method: parsedOrderInfo.payment_method || "vnpay",
                note: parsedOrderInfo.note || `VNPAY_TXN_REF:${txnRef}`
            });
        }

        const tuition = await tuitionsModel.getById(tuitionId);

        return res.redirect(302, buildFrontendUrl("/student/tuition/vnpay/result", {
            payment_status: "success",
            message: "Xu ly ket qua VNPAY thanh cong",
            txn_ref: txnRef,
            tuition_id: tuition?.id
        }));
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.redirect(302, buildFrontendUrl("/student/tuition/vnpay/result", {
            payment_status: "failed",
            message: statusCode === 500 ? "Loi xu ly ket qua VNPAY" : error.message
        }));
    }
};

exports.createTuition = async (req, res) => {
    try {
        const {
            student_id,
            semester_id,
            paid_amount,
            status,
            due_date
        } = req.body;

        if (!student_id || !semester_id) {
            return res.status(400).json({
                message: "Thieu student_id hoac semester_id"
            });
        }

        if (!isPositiveInteger(student_id) || !isPositiveInteger(semester_id)) {
            return res.status(400).json({
                message: "student_id va semester_id phai la so nguyen duong"
            });
        }

        if (!(await tuitionsModel.studentExists(Number(student_id)))) {
            return res.status(404).json({
                message: "Khong tim thay sinh vien"
            });
        }

        if (!(await tuitionsModel.semesterExists(Number(semester_id)))) {
            return res.status(404).json({
                message: "Khong tim thay hoc ky"
            });
        }

        if (await tuitionsModel.duplicateStudentSemesterExists(Number(student_id), Number(semester_id))) {
            return res.status(409).json({
                message: "Da ton tai hoc phi cua sinh vien trong hoc ky nay"
            });
        }

        if (Number(paid_amount ?? 0) < 0) {
            return res.status(400).json({
                message: "So tien da dong khong duoc am"
            });
        }

        const calculatedTuition = await tuitionsModel.calculateTuitionForStudentSemester(
            Number(student_id),
            Number(semester_id)
        );

        if (Number(calculatedTuition.amount) <= 0 || Number(calculatedTuition.total_credits) <= 0) {
            return res.status(409).json({
                message: "Khong co hoc phan hop le de tinh hoc phi cho sinh vien trong hoc ky nay"
            });
        }

        if (Number(paid_amount ?? 0) > Number(calculatedTuition.amount)) {
            return res.status(409).json({
                message: "paid_amount khong duoc lon hon amount"
            });
        }

        if (!isOneOf(status || "unpaid", TUITION_STATUSES)) {
            return res.status(400).json({
                message: "status hoc phi khong hop le"
            });
        }

        if (due_date && !isValidDateString(due_date)) {
            return res.status(400).json({
                message: "due_date khong hop le, can theo dinh dang YYYY-MM-DD"
            });
        }

        const result = await tuitionsModel.create({
            student_id,
            semester_id,
            total_credits: calculatedTuition.total_credits,
            amount: calculatedTuition.amount,
            paid_amount,
            status,
            due_date
        });

        return res.status(201).json({
            message: "Tao hoc phi thanh cong",
            id: result.insertId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi tao hoc phi",
            error: error.message
        });
    }
};

exports.updateTuition = async (req, res) => {
    try {
        const {
            student_id,
            semester_id,
            paid_amount,
            status,
            due_date
        } = req.body;

        if (!student_id || !semester_id) {
            return res.status(400).json({
                message: "Thieu student_id hoac semester_id"
            });
        }

        if (!isPositiveInteger(student_id) || !isPositiveInteger(semester_id)) {
            return res.status(400).json({
                message: "student_id va semester_id phai la so nguyen duong"
            });
        }

        if (!(await tuitionsModel.studentExists(Number(student_id)))) {
            return res.status(404).json({
                message: "Khong tim thay sinh vien"
            });
        }

        if (!(await tuitionsModel.semesterExists(Number(semester_id)))) {
            return res.status(404).json({
                message: "Khong tim thay hoc ky"
            });
        }

        if (await tuitionsModel.duplicateStudentSemesterExists(Number(student_id), Number(semester_id), req.params.id)) {
            return res.status(409).json({
                message: "Da ton tai hoc phi cua sinh vien trong hoc ky nay"
            });
        }

        if (Number(paid_amount ?? 0) < 0) {
            return res.status(400).json({
                message: "So tien da dong khong duoc am"
            });
        }

        const calculatedTuition = await tuitionsModel.calculateTuitionForStudentSemester(
            Number(student_id),
            Number(semester_id)
        );

        if (Number(calculatedTuition.amount) <= 0 || Number(calculatedTuition.total_credits) <= 0) {
            return res.status(409).json({
                message: "Khong co hoc phan hop le de tinh hoc phi cho sinh vien trong hoc ky nay"
            });
        }

        if (Number(paid_amount ?? 0) > Number(calculatedTuition.amount)) {
            return res.status(409).json({
                message: "paid_amount khong duoc lon hon amount"
            });
        }

        if (!isOneOf(status || "unpaid", TUITION_STATUSES)) {
            return res.status(400).json({
                message: "status hoc phi khong hop le"
            });
        }

        if (due_date && !isValidDateString(due_date)) {
            return res.status(400).json({
                message: "due_date khong hop le, can theo dinh dang YYYY-MM-DD"
            });
        }

        const result = await tuitionsModel.update(req.params.id, {
            student_id,
            semester_id,
            total_credits: calculatedTuition.total_credits,
            amount: calculatedTuition.amount,
            paid_amount,
            status,
            due_date
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay hoc phi"
            });
        }

        return res.json({
            message: "Cap nhat hoc phi thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi cap nhat hoc phi",
            error: error.message
        });
    }
};

exports.deleteTuition = async (req, res) => {
    try {
        const data = await tuitionsModel.getByIdForUser(req.params.id, req.user);

        if (!data) {
            return res.status(404).json({
                message: "Khong tim thay hoc phi"
            });
        }

        const result = await tuitionsModel.remove(req.params.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Khong tim thay hoc phi"
            });
        }

        return res.json({
            message: "Xoa hoc phi thanh cong"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Loi xoa hoc phi",
            error: error.message
        });
    }
};
