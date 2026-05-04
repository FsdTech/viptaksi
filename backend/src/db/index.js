const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function initDatabase() {
  try {
    console.log("[DB] Connecting...");
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("[DB] Connected");
    return true;
  } catch (err) {
    console.error("[DB ERROR]:", err.message);
    return false;
  }
}

function isDatabaseAvailable() {
  return true;
}

module.exports = { pool, initDatabase, isDatabaseAvailable };
