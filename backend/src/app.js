const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const { loadEnv } = require("./config/env");
const { api } = require("./routes");
const { errorHandler } = require("./middlewares/errorHandler");
/* ADDED */
const { verifyToken } = require("./utils/jwt.util");
/* ADDED */
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
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
  /* ADDED */
  app.use(async (req, res, next) => {
    if (!isDatabaseAvailable()) {
      return next();
    }
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

  app.use(api);

  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
