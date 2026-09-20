const express = require("express");
const router = express.Router();

const roleController = require("../controllers/roleController");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);
router.use(authorizeRoles("admin", 1));

router.get("/", roleController.getRoles);

router.get("/:id", roleController.getRoleById);

router.post("/", roleController.createRole);

router.put("/:id", roleController.updateRole);

router.delete("/:id", roleController.deleteRole);

module.exports = router;
