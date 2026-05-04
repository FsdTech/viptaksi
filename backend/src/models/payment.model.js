const { query } = require("../config/database");

async function create({
  driverId,
  amount,
  status = "pending",
  expireAt = null,
  planType = "monthly",
  receiptUrl = null,
}) {
  const { rows } = await query(
    `INSERT INTO payments (driver_id, amount, status, expire_at, plan_type, receipt_url)
     VALUES ($1, $2, $3::payment_status, $4, $5, $6)
     RETURNING *`,
    [driverId, amount, status, expireAt, planType, receiptUrl]
  );
  return rows[0];
}

async function listWithDriver() {
  const { rows } = await query(`
    SELECT
      p.*,
      d.user_id AS driver_user_id,
      u.name AS driver_name,
      u.email AS driver_email
    FROM payments p
    JOIN drivers d ON d.id = p.driver_id
    JOIN users u ON u.id = d.user_id
    ORDER BY p.created_at DESC
    LIMIT 500
  `);
  return rows;
}

async function updateMeta(id, { planType, amount, receiptUrl }) {
  const { rows } = await query(
    `
      UPDATE payments
      SET
        plan_type = COALESCE($2, plan_type),
        amount = COALESCE($3, amount),
        receipt_url = COALESCE($4, receipt_url),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [id, planType ?? null, amount ?? null, receiptUrl ?? null]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(`SELECT * FROM payments WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function approve(id, expireAt) {
  const { rows } = await query(
    `UPDATE payments
     SET status = 'approved'::payment_status,
         expire_at = $2,
         updated_at = NOW()
     WHERE id = $1 AND status = 'pending'::payment_status
     RETURNING *`,
    [id, expireAt]
  );
  return rows[0] || null;
}

async function reject(id) {
  const { rows } = await query(
    `UPDATE payments
     SET status = 'rejected'::payment_status,
         expire_at = NULL,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return rows[0] || null;
}

async function resetToPending(id) {
  const { rows } = await query(
    `UPDATE payments
     SET status = 'pending'::payment_status,
         expire_at = NULL,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { create, listWithDriver, findById, approve, reject, resetToPending, updateMeta };
