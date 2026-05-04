/* EKLENDİ */
const fs = require("fs");
const path = require("path");
require("../config/env");
const { getPool } = require("../config/database");

async function main() {
  const p = path.join(__dirname, "../../sql/chat_schema.sql");
  const sql = fs.readFileSync(p, "utf8");
  const pool = getPool();
  await pool.query(sql);
  await pool.end();
  console.log("Applied sql/chat_schema.sql");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
