const http = require("http");
const { loadEnv } = require("./config/env");
const { createApp } = require("./app");
const { initSocket } = require("./sockets");
const { initDatabase } = require("./db");
const { deactivateExpiredDrivers } = require("./services/paymentExpiry.service");

/* EKLENDİ */
async function startServer() {
  const env = loadEnv();
  const app = createApp();
  let databaseReady = false;
  /* ADDED */
  app.get("/", (req, res) => {
    res.json({
      status: "OK",
      message: "VipStar Backend Running",
      version: "1.0.0",
    });
  });
  app.get("/health/db", (_req, res) => {
    res.status(databaseReady ? 200 : 503).json({
      ok: databaseReady,
      service: "viptaksi-backend-db",
      status: databaseReady ? "online" : "offline",
    });
  });
  const server = http.createServer(app);

  initSocket(server);

  try {
    await initDatabase();
    databaseReady = true;
    try {
      await deactivateExpiredDrivers();
    } catch (expiryErr) {
      console.error("Initial expiry sync failed:", expiryErr);
    }
  } catch (error) {
    console.error("Server startup warning: database is offline, running in degraded mode.", error);
  }

  server.listen(env.port, () => {
    console.log(`VipStar Taksi API + Socket.IO listening on port ${env.port} (${env.nodeEnv})`);
    if (!databaseReady) {
      console.warn("Database is not reachable. Start PostgreSQL on port 5432 to enable DB features.");
    }
  });

  setInterval(() => {
    if (!databaseReady) return;
    void deactivateExpiredDrivers().catch((error) => {
      console.error("Expiry sync interval failed:", error);
    });
  }, 60_000);
}

module.exports = { startServer };
