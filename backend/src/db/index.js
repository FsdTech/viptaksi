const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function waitForDB() {
  let retries = 5;
  while (retries) {
    try {
      await pool.query("SELECT 1");
      console.log("DB connected");
      return;
    } catch (err) {
      console.log("DB retry...");
      await new Promise((r) => setTimeout(r, 2000));
      retries--;
    }
  }
  throw new Error("Database unreachable after retries");
}

async function initDatabase() {
  try {
    await waitForDB();
    return true;
  } catch (err) {
    console.error("[DB ERROR]:", err.message);
    return false;
  }
}

function isDatabaseAvailable() {
  return true;
}

module.exports = { pool, initDatabase, waitForDB, isDatabaseAvailable };
