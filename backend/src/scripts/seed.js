require("../config/env");
const userModel = require("../models/user.model");
const { hashPassword } = require("../utils/password.util");
const { getPool } = require("../config/database");

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@viptaksi.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Platform Admin";

async function main() {
  const existing = await userModel.findByEmail(ADMIN_EMAIL);
  if (existing) {
    console.log(`Admin already exists (${ADMIN_EMAIL}), skipping.`);
    const pool = getPool();
    await pool.end();
    return;
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  const user = await userModel.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash,
    role: "admin",
  });

  console.log("Seeded admin user:");
  console.log(`  email:    ${user.email}`);
  console.log(`  password: ${ADMIN_PASSWORD}`);
  console.log("Change SEED_ADMIN_PASSWORD or rotate credentials in production.");

  const pool = getPool();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
