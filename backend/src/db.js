const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testConnection() {
  await pool.query("SELECT 1");
  console.log("DB connected");
}

function isDatabaseAvailable() {
  return true;
}

module.exports = { pool, testConnection, isDatabaseAvailable };
