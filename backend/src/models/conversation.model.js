/* EKLENDİ */
const { query } = require("../config/database");

async function findById(id) {
  const { rows } = await query(`SELECT * FROM conversations WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findDriverAdmin(adminId, driverId) {
  const { rows } = await query(
    `SELECT * FROM conversations WHERE admin_id = $1 AND driver_id = $2 AND type = 'driver_admin'::conversation_type`,
    [adminId, driverId]
  );
  return rows[0] || null;
}

async function findRiderAdmin(adminId, riderUserId) {
  const { rows } = await query(
    `SELECT * FROM conversations WHERE admin_id = $1 AND rider_id = $2 AND type = 'rider_admin'::conversation_type`,
    [adminId, riderUserId]
  );
  return rows[0] || null;
}

async function create({ type, driverId, riderId, adminId }) {
  const { rows } = await query(
    `INSERT INTO conversations (type, driver_id, rider_id, admin_id)
     VALUES ($1::conversation_type, $2, $3, $4)
     RETURNING *`,
    [type, driverId || null, riderId || null, adminId]
  );
  return rows[0];
}

async function listForAdmin(adminUserId) {
  const { rows } = await query(
    `
    SELECT
      c.*,
      COALESCE(du.name, ru.name, '') AS peer_name,
      COALESCE(du.email, ru.email, '') AS peer_email,
      lm.id AS last_message_id,
      lm.message AS last_message_text,
      lm.sender_type AS last_message_sender_type,
      lm.created_at AS last_message_at,
      (
        SELECT COUNT(*)::int FROM messages m
        WHERE m.conversation_id = c.id
          AND m.is_read = FALSE
          AND m.sender_type <> 'admin'::message_sender_type
      ) AS unread_for_admin
    FROM conversations c
    LEFT JOIN drivers d ON d.id = c.driver_id
    LEFT JOIN users du ON du.id = d.user_id
    LEFT JOIN users ru ON ru.id = c.rider_id
    LEFT JOIN LATERAL (
      SELECT id, message, sender_type, created_at
      FROM messages
      WHERE conversation_id = c.id
      ORDER BY created_at DESC
      LIMIT 1
    ) lm ON TRUE
    WHERE c.admin_id = $1
    ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC
    `,
    [adminUserId]
  );
  return rows;
}

module.exports = {
  findById,
  findDriverAdmin,
  findRiderAdmin,
  create,
  listForAdmin,
};
