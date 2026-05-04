const { Router } = require("express");
const authRoutes = require("./auth.routes");
const driverRoutes = require("./driver.routes");
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

const api = Router();
api.use("/auth", authRoutes);
api.use("/drivers", driverRoutes);
api.use("/vehicle-types", vehicleTypeRoutes);
api.use("/trips", tripRoutes);
api.use("/payments", paymentRoutes);
/* ADDED */
api.use("/api/public", publicRoutes);
api.use("/api", landingRoutes);
/* EKLENDİ */
api.use(chatApiRoutes);
/* EKLENDİ */
api.use("/settings", settingsRoutes);
/* EKLENDİ */
api.use("/admins", adminsRoutes);
/* ADDED */
api.use("/admin", adminsRoutes);
api.use("/dashboard", dashboardRoutes);
api.use("/passengers", passengerRoutes);
api.use("/uploads", uploadRoutes);
api.use("/driver-applications", driverApplicationRoutes);

api.get("/health", (req, res) => {
  res.json({ ok: true, service: "viptaksi-backend" });
});

/** Mighty-style Flutter apps: Google / Apple social login */
api.post("/api/social-login", compatAppApiController.socialLogin);
api.post("/api/login", compatAppApiController.appLogin);

module.exports = { api };
