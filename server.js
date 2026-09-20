require("dotenv").config();
require("./utils/cron");

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const subjectsRoutes = require("./routes/subjects.routes");
const courseSectionsRoutes = require("./routes/courseSections.routes");
const roleRoutes = require("./routes/roleRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const dashboardRoutes = require("./routes/dashboard.routes");
const academicYearsRoutes = require("./routes/academicYears.routes");
const semestersRoutes = require("./routes/semesters.routes");
const classesRoutes = require("./routes/classes.routes");
const lecturerInfoRoutes = require("./routes/lecturerInfo.routes");
const studentInfoRoutes = require("./routes/studentInfo.routes");
const enrollmentsRoutes = require("./routes/enrollments.routes");
const gradesRoutes = require("./routes/grades.routes");
const subjectPrerequisitesRoutes = require("./routes/subjectPrerequisites.routes");
const otpCodesRoutes = require("./routes/otpCodes.routes");
const schedulesRoutes = require("./routes/schedules.routes");
const tuitionsRoutes = require("./routes/tuitions.routes");
const tuitionPaymentsRoutes = require("./routes/tuitionPayments.routes");
const attendanceSessionsRoutes = require("./routes/attendanceSessions.routes");
const reportsRoutes = require("./routes/reports.routes");
const trainingProgramsRoutes = require("./routes/trainingPrograms.routes");
const graduationRequirementsRoutes = require("./routes/graduationRequirements.routes");
const studentStatusRecordsRoutes = require("./routes/studentStatusRecords.routes");
const scholarshipsRoutes = require("./routes/scholarships.routes");
const disciplinaryActionsRoutes = require("./routes/disciplinaryActions.routes");
const academicAdvisorsRoutes = require("./routes/academicAdvisors.routes");
const tuitionsModel = require("./models/tuitions.model");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectsRoutes);
app.use("/api/course-sections", courseSectionsRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/academic-years", academicYearsRoutes);
app.use("/api/semesters", semestersRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api/lecturer-info", lecturerInfoRoutes);
app.use("/api/student-info", studentInfoRoutes);
app.use("/api/enrollments", enrollmentsRoutes);
app.use("/api/grades", gradesRoutes);
app.use("/api/subject-prerequisites", subjectPrerequisitesRoutes);
app.use("/api/otp-codes", otpCodesRoutes);
app.use("/api/schedules", schedulesRoutes);
app.use("/api/tuitions", tuitionsRoutes);
app.use("/api/tuition-payments", tuitionPaymentsRoutes);
app.use("/api/attendance-sessions", attendanceSessionsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/training-programs", trainingProgramsRoutes);
app.use("/api/graduation-requirements", graduationRequirementsRoutes);
app.use("/api/student-status-records", studentStatusRecordsRoutes);
app.use("/api/scholarships", scholarshipsRoutes);
app.use("/api/disciplinary-actions", disciplinaryActionsRoutes);
app.use("/api/academic-advisors", academicAdvisorsRoutes);

async function startServer() {
    try {
        const syncResult = await tuitionsModel.syncCalculatedAmountsAndStatuses();
        console.log(`Tuition sync completed: ${syncResult.affectedRows} rows updated`);
    } catch (error) {
        console.error("Tuition sync failed:", error.message);
    }

    app.listen(5000, () => {
        console.log("Server running on port 5000");
    });
}

startServer();
