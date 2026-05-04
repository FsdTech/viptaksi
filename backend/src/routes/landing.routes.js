const { Router } = require("express");
const { getLanding, saveLanding } = require("../controllers/landing.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizePanel } = require("../middlewares/authorizePanel");
const { requireSuperAdmin } = require("../middlewares/requireSuperAdmin");

/* ADDED */
const router = Router();

/* ADDED */
router.get("/landing", getLanding);
/* ADDED */
router.post("/landing", authenticate, authorizePanel, requireSuperAdmin, saveLanding);

module.exports = router;
