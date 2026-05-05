require("dns").setDefaultResultOrder("ipv4first");

const http = require("http");
const { loadEnv } = require("./config/env");
const { createApp } = require("./app");
const { initSocket } = require("./sockets");
const { testConnection } = require("./db");
const { deactivateExpiredDrivers } = require("./services/paymentExpiry.service");

async function waitForDB() {
  let retries = 5;
  while (retries) {
    try {
      await testConnection();
      return;
    } catch (err) {
      console.log("DB retry...");
      await new Promise((r) => setTimeout(r, 2000));
      retries--;
    }
  }
}

async function startServer() {
  const env = loadEnv();
  const app = createApp();

  let databaseReady = false;

  app.get("/", (req, res) => {
    res.json({
      status: "OK",
      message: "VipStar Backend Running",
    });
  });

  app.get("/health/db", (_req, res) => {
    res.status(databaseReady ? 200 : 503).json({
      ok: databaseReady,
      service: "viptaksi-db",
      status: databaseReady ? "online" : "offline",
    });
  });

  const server = http.createServer(app);
  initSocket(server);

  try {
    await waitForDB();
    databaseReady = true;

    try {
      await deactivateExpiredDrivers();
    } catch (e) {
      console.error("Expiry sync failed:", e);
    }
  } catch (err) {
    console.error("DB FAILED:", err);
  }

  server.listen(env.port, () => {
    console.log(`Server running on ${env.port}`);
  });
}

module.exports = { startServer };
