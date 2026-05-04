const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function initDatabase() {
  try {
    console.log("[DB] Connecting...");

    const client = await pool.connect();

    const result = await client.query("SELECT NOW()");
    console.log("[DB] Connected at:", result.rows[0].now);

    client.release();

    return true;
  } catch (err) {
    console.error("[DB] CONNECTION ERROR:", err.message);
    return false;
  }
}

function isDatabaseAvailable() {
  return true; // we trust init check
}

module.exports = {
  pool,
  initDatabase,
  isDatabaseAvailable,
};
