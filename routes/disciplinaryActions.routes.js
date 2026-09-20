const express = require("express");
const router = express.Router();
const disciplinaryActionsController = require("../controllers/disciplinaryActions.controller");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), disciplinaryActionsController.getAllDisciplinaryActions);
router.get("/me", authorizeRoles("student", 3), disciplinaryActionsController.getMyDisciplinaryActions);
router.get("/:id", authorizeRoles("admin", 1, "lecturer", 2, "student", 3), disciplinaryActionsController.getDisciplinaryActionById);
router.post("/", authorizeRoles("admin", 1), disciplinaryActionsController.createDisciplinaryAction);
router.put("/:id", authorizeRoles("admin", 1), disciplinaryActionsController.updateDisciplinaryAction);
router.delete("/:id", authorizeRoles("admin", 1), disciplinaryActionsController.deleteDisciplinaryAction);

module.exports = router;
