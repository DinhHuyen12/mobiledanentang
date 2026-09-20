const express = require("express");
const router = express.Router();

const controller = require("../controllers/courseSections.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", controller.getAll);
router.get("/registration-display", controller.getRegistrationDisplayInfo);

router.get("/:id", controller.getById);

router.post("/", authorizeRoles("admin", 1, "lecturer", 2), controller.create);

router.put("/:id", authorizeRoles("admin", 1, "lecturer", 2), controller.update);

router.delete("/:id", authorizeRoles("admin", 1), controller.delete);

module.exports = router;
