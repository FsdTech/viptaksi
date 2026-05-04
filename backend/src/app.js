const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");

const { loadEnv } = require("./config/env");
const { api } = require("./routes");
const { errorHandler } = require("./middlewares/errorHandler");

const { verifyToken } = require("./utils/jwt.util");
const { pool, isDatabaseAvailable } = require("./db");

function createApp() {
  const env = loadEnv();
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: env.corsOrigins.includes("*") ? true : env.corsOrigins,
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));

  // static files
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  // 🔥 HEALTH CHECK (TEST İÇİN)
  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "viptaksi-backend" });
  });

  // 🔥 DB HEALTH
  app.get("/health/db", (_req, res) => {
    const ok = isDatabaseAvailable();
    res.status(ok ? 200 : 503).json({
      ok,
      service: "viptaksi-db",
      status: ok ? "online" : "offline",
    });
  });

  // 🔥 ADMIN SESSION HEARTBEAT
  app.use(async (req, res, next) => {
    if (!isDatabaseAvailable()) return next();

    try {
      const header = req.headers.authorization || "";
      const [type, token] = header.split(" ");

      if (type === "Bearer" && token) {
        const payload = verifyToken(token);

        if (payload?.admin_id) {
          await pool.query(
            "UPDATE admin_sessions SET last_seen = NOW(), is_active = true WHERE admin_id = $1",
            [payload.admin_id]
          );
        }
      }
    } catch (error) {
      const name = error?.name;
      if (name !== "TokenExpiredError" && name !== "JsonWebTokenError") {
        console.error("Admin session heartbeat error:", error);
      }
    }

    next();
  });

  // 🔥 EN KRİTİK SATIR (BU EKSİKTİ)
  app.use("/api", api);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };