const express = require("express");

const router = express.Router();

// IMPORT ROUTES
const usersRouter = require("./users.routes");
const driversRouter = require("./drivers.routes");
const authRoutes = require("./auth.routes");
const vehicleTypeRoutes = require("./vehicleType.routes");
const tripRoutes = require("./trip.routes");
const paymentRoutes = require("./payment.routes");
/* EKLENDİ */
const chatApiRoutes = require("./chat.api.routes");
/* EKLENDİ */
const settingsRoutes = require("./settings.routes");
/* EKLENDİ */
const adminsRoutes = require("./admins.routes");
/* ADDED */
const landingRoutes = require("./landing.routes");
const publicRoutes = require("./public.routes");
const dashboardRoutes = require("./dashboard.routes");
const passengerRoutes = require("./passenger.routes");
const uploadRoutes = require("./upload.routes");
const driverApplicationRoutes = require("./driverApplication.routes");
const compatAppApiController = require("../controllers/compatAppApi.controller");

// MOUNT ROUTES
router.use("/users", usersRouter);
router.use("/drivers", driversRouter);

router.use("/auth", authRoutes);
router.use("/vehicle-types", vehicleTypeRoutes);
router.use("/trips", tripRoutes);
router.use("/payments", paymentRoutes);
/* ADDED */
router.use("/api/public", publicRoutes);
router.use("/api", landingRoutes);
/* EKLENDİ */
router.use(chatApiRoutes);
/* EKLENDİ */
router.use("/settings", settingsRoutes);
/* EKLENDİ */
router.use("/admins", adminsRoutes);
/* ADDED */
router.use("/admin", adminsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/passengers", passengerRoutes);
router.use("/uploads", uploadRoutes);
router.use("/driver-applications", driverApplicationRoutes);

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "viptaksi-backend" });
});

/** Mighty-style Flutter apps: Google / Apple social login */
router.post("/api/social-login", compatAppApiController.socialLogin);
router.post("/api/login", compatAppApiController.appLogin);

module.exports = { api: router };
