const { Pool } = require("pg");

console.log("DB URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString:
    "postgresql://postgres:Salestaxi123.@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: { rejectUnauthorized: false },
});

function isDatabaseAvailable() {
  return true;
}

module.exports = { pool, isDatabaseAvailable };
