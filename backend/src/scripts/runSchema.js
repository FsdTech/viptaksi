const fs = require("fs");
const path = require("path");
require("../config/env");
const { getPool } = require("../config/database");

async function main() {
  const schemaPath = path.join(__dirname, "../../sql/schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  const pool = getPool();
  await pool.query(sql);
  await pool.end();
  console.log("Applied sql/schema.sql");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
