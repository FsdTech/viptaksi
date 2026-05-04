const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

function parseOrigins(raw) {
  if (!raw || typeof raw !== "string") return ["*"];
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : ["*"];
}

function loadEnv() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const port = Number(process.env.PORT) || 4000;

  const databaseUrl = process.env.DATABASE_URL;
  const pgConfig = {
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
    database: process.env.PGDATABASE || "viptaksi",
  };

  const jwtSecret = process.env.JWT_SECRET;
  if (nodeEnv === "production" && (!jwtSecret || jwtSecret.length < 32)) {
    throw new Error("JWT_SECRET must be set to a strong value in production (32+ chars).");
  }

  return {
    nodeEnv,
    port,
    databaseUrl: databaseUrl || null,
    pgConfig,
    jwtSecret: jwtSecret || "dev-only-change-me",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    /** Access token TTL (mobile). Default 24h for dev ergonomism; use 15m in production if desired */
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "24h",
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  };
}

module.exports = { loadEnv };
