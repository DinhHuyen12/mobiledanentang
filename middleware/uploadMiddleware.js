const fs = require("fs");
const path = require("path");
const multer = require("multer");

const ensureDirectory = (directoryPath) => {
    fs.mkdirSync(directoryPath, { recursive: true });
};

const uploadsRoot = path.join(__dirname, "..", "uploads");
const studentDocumentsDir = path.join(uploadsRoot, "student-documents");

ensureDirectory(studentDocumentsDir);

const excelUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = new Set([
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "application/octet-stream"
        ]);
        const extension = path.extname(file.originalname || "").toLowerCase();

        if (allowedMimeTypes.has(file.mimetype) && [".xlsx", ".xls"].includes(extension)) {
            return cb(null, true);
        }

        return cb(new Error("Chi chap nhan file Excel .xlsx hoac .xls"));
    }
});

const studentDocumentsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, studentDocumentsDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname || "");
        const baseName = path
            .basename(file.originalname || "document", extension)
            .replace(/[^a-zA-Z0-9-_]/g, "_");

        cb(null, `${Date.now()}-${baseName}${extension}`);
    }
});

const studentDocumentsUpload = multer({
    storage: studentDocumentsStorage,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 5
    }
});

module.exports = {
    excelUpload,
    studentDocumentsUpload
};
