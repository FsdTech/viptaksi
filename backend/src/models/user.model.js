const { query } = require("../config/database");

async function findByEmail(email) {
  const { rows } = await query(
    `SELECT id, name, email, phone, password_hash, role, created_at, updated_at
     FROM users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(
    `SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create({ name, email, phone, passwordHash, role }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5::user_role)
     RETURNING id, name, email, phone, role, created_at, updated_at`,
    [name, email, phone ?? null, passwordHash, role]
  );
  return rows[0];
}

module.exports = { findByEmail, findById, create };
