/* EKLENDİ */
const { query } = require("../config/database");

async function insertChat({ adminUserId, title, body, payload }) {
  const { rows } = await query(
    `INSERT INTO admin_notifications (admin_user_id, type, title, body, payload)
     VALUES ($1, 'chat_message', $2, $3, $4)
     RETURNING *`,
    [adminUserId, title, body, payload ?? null]
  );
  return rows[0];
}

async function unreadCount(adminUserId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS n FROM admin_notifications
     WHERE admin_user_id = $1 AND is_read = FALSE`,
    [adminUserId]
  );
  return rows[0]?.n ?? 0;
}

module.exports = { insertChat, unreadCount };
