const { spawnSync } = require("child_process");
const path = require("path");

const filesToCheck = [
    "server.js",
    "controllers/authController.js",
    "controllers/studentInfo.controller.js",
    "controllers/grades.controller.js",
    "controllers/attendanceSessions.controller.js",
    "controllers/reports.controller.js",
    "controllers/enrollments.controller.js",
    "controllers/trainingPrograms.controller.js",
    "controllers/graduationRequirements.controller.js",
    "controllers/studentStatusRecords.controller.js",
    "controllers/scholarships.controller.js",
    "controllers/disciplinaryActions.controller.js",
    "controllers/academicAdvisors.controller.js",
    "models/studentInfo.model.js",
    "models/studentDocuments.model.js",
    "models/grades.model.js",
    "models/enrollments.model.js",
    "models/reports.model.js",
    "models/trainingPrograms.model.js",
    "models/graduationRequirements.model.js",
    "models/studentStatusRecords.model.js",
    "models/scholarships.model.js",
    "models/disciplinaryActions.model.js",
    "models/academicAdvisors.model.js",
    "routes/authRoutes.js",
    "routes/studentInfo.routes.js",
    "routes/grades.routes.js",
    "routes/attendanceSessions.routes.js",
    "routes/enrollments.routes.js",
    "routes/reports.routes.js",
    "routes/trainingPrograms.routes.js",
    "routes/graduationRequirements.routes.js",
    "routes/studentStatusRecords.routes.js",
    "routes/scholarships.routes.js",
    "routes/disciplinaryActions.routes.js",
    "routes/academicAdvisors.routes.js",
    "middleware/uploadMiddleware.js",
    "utils/excel.js"
];

let hasFailure = false;

for (const relativeFilePath of filesToCheck) {
    const absoluteFilePath = path.resolve(__dirname, "..", relativeFilePath);
    const result = spawnSync(process.execPath, ["--check", absoluteFilePath], {
        encoding: "utf8"
    });

    if (result.status !== 0) {
        hasFailure = true;
        process.stderr.write(`Syntax check failed: ${relativeFilePath}\n`);
        if (result.stderr) {
            process.stderr.write(`${result.stderr}\n`);
        }
    }
}

if (hasFailure) {
    process.exit(1);
}

console.log("Smoke test passed.");
