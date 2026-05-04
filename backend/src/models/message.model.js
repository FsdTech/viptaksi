/* EKLENDİ */
const { query } = require("../config/database");

async function insert({ conversationId, senderType, senderId, message }) {
  const { rows } = await query(
    `INSERT INTO messages (conversation_id, sender_type, sender_id, message)
     VALUES ($1, $2::message_sender_type, $3, $4)
     RETURNING *`,
    [conversationId, senderType, senderId, message]
  );
  return rows[0];
}

async function listByConversation(conversationId, limit = 200) {
  const { rows } = await query(
    `SELECT m.*, u.name AS sender_name
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at ASC
     LIMIT $2`,
    [conversationId, limit]
  );
  return rows;
}

async function markReadForAdmin(conversationId) {
  await query(
    `UPDATE messages SET is_read = TRUE
     WHERE conversation_id = $1
       AND sender_type <> 'admin'::message_sender_type
       AND is_read = FALSE`,
    [conversationId]
  );
}

async function markReadForPeer(conversationId) {
  await query(
    `UPDATE messages SET is_read = TRUE
     WHERE conversation_id = $1
       AND sender_type = 'admin'::message_sender_type
       AND is_read = FALSE`,
    [conversationId]
  );
}

async function unreadTotalForAdmin(adminUserId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS n
     FROM messages m
     JOIN conversations c ON c.id = m.conversation_id
     WHERE c.admin_id = $1
       AND m.is_read = FALSE
       AND m.sender_type <> 'admin'::message_sender_type`,
    [adminUserId]
  );
  return rows[0]?.n ?? 0;
}

module.exports = {
  insert,
  listByConversation,
  markReadForAdmin,
  markReadForPeer,
  unreadTotalForAdmin,
};
