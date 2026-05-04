const { Router } = require("express");
const {
  getAdminRoles,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getActiveAdmins,
} = require("../controllers/admins.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizePanel } = require("../middlewares/authorizePanel");
const { requireSuperAdmin } = require("../middlewares/requireSuperAdmin");

/* EKLENDİ */
const router = Router();

router.get("/active", authenticate, getActiveAdmins);
router.get("/roles", authenticate, authorizePanel, getAdminRoles);
router.get("/", authenticate, getAdmins);
router.post("/", authenticate, requireSuperAdmin, createAdmin);
router.put("/:id", authenticate, updateAdmin);
router.delete("/:id", authenticate, requireSuperAdmin, deleteAdmin);

module.exports = router;
