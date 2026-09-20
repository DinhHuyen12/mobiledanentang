const express = require("express");
const router = express.Router();
const schedulesController = require("../controllers/schedules.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", schedulesController.getAllSchedules);
router.get("/:id", schedulesController.getScheduleById);
router.post("/", authorizeRoles("admin", 1, "lecturer", 2), schedulesController.createSchedule);
router.put("/:id", authorizeRoles("admin", 1, "lecturer", 2), schedulesController.updateSchedule);
router.delete("/:id", authorizeRoles("admin", 1), schedulesController.deleteSchedule);

module.exports = router;
