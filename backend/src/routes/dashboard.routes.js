const { Router } = require("express");
const { authenticate } = require("../middlewares/authenticate");
const { authorizePanel } = require("../middlewares/authorizePanel");
const dashboardController = require("../controllers/dashboard.controller");

const router = Router();

router.get("/summary", authenticate, authorizePanel, dashboardController.summary);
router.get("/revenue-series", authenticate, authorizePanel, dashboardController.revenueSeries);
router.get("/recent-drivers", authenticate, authorizePanel, dashboardController.recentDrivers);

module.exports = router;
