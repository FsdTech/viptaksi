const { query } = require("../config/database");

async function listActive() {
  const { rows } = await query(
    `SELECT id, name, base_fare, per_km_rate, per_min_rate, is_active, created_at, updated_at
     FROM vehicle_types WHERE is_active = TRUE ORDER BY name ASC`
  );
  return rows;
}

async function listAll() {
  const { rows } = await query(
    `SELECT id, name, base_fare, per_km_rate, per_min_rate, is_active, created_at, updated_at
     FROM vehicle_types ORDER BY name ASC`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await query(`SELECT * FROM vehicle_types WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findByName(name) {
  const { rows } = await query(
    `SELECT * FROM vehicle_types WHERE LOWER(name) = LOWER($1)`,
    [name]
  );
  return rows[0] || null;
}

async function updateFields(id, fields) {
  const cols = [];
  const vals = [];
  let i = 1;
  if (fields.name !== undefined) {
    cols.push(`name = $${i++}`);
    vals.push(fields.name);
  }
  if (fields.base_fare !== undefined) {
    cols.push(`base_fare = $${i++}`);
    vals.push(fields.base_fare);
  }
  if (fields.per_km_rate !== undefined) {
    cols.push(`per_km_rate = $${i++}`);
    vals.push(fields.per_km_rate);
  }
  if (fields.per_min_rate !== undefined) {
    cols.push(`per_min_rate = $${i++}`);
    vals.push(fields.per_min_rate);
  }
  if (fields.is_active !== undefined) {
    cols.push(`is_active = $${i++}`);
    vals.push(fields.is_active);
  }
  if (!cols.length) return findById(id);
  vals.push(id);
  const { rows } = await query(
    `UPDATE vehicle_types SET ${cols.join(", ")} WHERE id = $${i}
     RETURNING id, name, base_fare, per_km_rate, per_min_rate, is_active, created_at, updated_at`,
    vals
  );
  return rows[0] || null;
}

module.exports = { listActive, listAll, findById, findByName, updateFields };
