const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);
router.use(authorizeRoles("admin", 1));

router.get("/search", userController.searchUsers);

router.get("/", userController.getAllUsers);

router.get("/:id", userController.getUserById);

router.post("/", userController.createUser);

router.put("/:id", userController.updateUser);

router.delete("/:id", userController.deleteUser);


module.exports = router;
