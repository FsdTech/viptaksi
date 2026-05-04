/* EKLENDİ */
const conversationModel = require("../models/conversation.model");
const messageModel = require("../models/message.model");
const adminNotificationModel = require("../models/adminNotification.model");
const userModel = require("../models/user.model");
const driverModel = require("../models/driver.model");
const { AppError } = require("../utils/AppError");
const { emitToAdmins, emitToRoom } = require("../sockets/realtime.registry");

async function getFirstAdminUser() {
  const { query } = require("../config/database");
  const { rows } = await query(
    `SELECT id, name, email, role FROM users WHERE role = 'admin'::user_role ORDER BY created_at ASC LIMIT 1`
  );
  return rows[0] || null;
}

async function assertConversationAccess(user, conv) {
  if (!conv) throw new AppError(404, "Conversation not found");
  if (user.role === "admin" && String(conv.admin_id) === String(user.id)) return;
  if (user.role === "driver") {
    const d = await driverModel.findByUserId(user.id);
    if (d && String(conv.driver_id) === String(d.id)) return;
  }
  if (user.role === "rider" && String(conv.rider_id) === String(user.id)) return;
  throw new AppError(403, "Forbidden");
}

function mapSenderType(role) {
  if (role === "admin") return "admin";
  if (role === "driver") return "driver";
  if (role === "rider") return "rider";
  throw new AppError(400, "Invalid role for chat");
}

async function findOrCreateDriverConversation(driverRowId, adminUserId) {
  let c = await conversationModel.findDriverAdmin(adminUserId, driverRowId);
  if (c) return c;
  return conversationModel.create({
    type: "driver_admin",
    driverId: driverRowId,
    riderId: null,
    adminId: adminUserId,
  });
}

async function findOrCreateRiderConversation(riderUserId, adminUserId) {
  const rider = await userModel.findById(riderUserId);
  if (!rider || rider.role !== "rider") {
    throw new AppError(400, "Invalid rider user");
  }
  let c = await conversationModel.findRiderAdmin(adminUserId, riderUserId);
  if (c) return c;
  return conversationModel.create({
    type: "rider_admin",
    driverId: null,
    riderId: riderUserId,
    adminId: adminUserId,
  });
}

function buildPayload(conv, msgRow, senderName) {
  return {
    message: {
      id: msgRow.id,
      conversation_id: msgRow.conversation_id,
      sender_type: msgRow.sender_type,
      sender_id: msgRow.sender_id,
      sender_name: senderName,
      message: msgRow.message,
      is_read: msgRow.is_read,
      created_at: msgRow.created_at,
    },
    conversation: {
      id: conv.id,
      type: conv.type,
      driver_id: conv.driver_id,
      rider_id: conv.rider_id,
      admin_id: conv.admin_id,
      updated_at: conv.updated_at,
    },
  };
}

async function emitChatEvents(conv, msgRow, senderName) {
  const payload = buildPayload(conv, msgRow, senderName);
  emitToAdmins("message:new", payload);
  emitToAdmins("conversation:update", {
    conversationId: conv.id,
    lastMessage: payload.message,
  });
  if (conv.type === "driver_admin" && conv.driver_id) {
    emitToRoom(`driver:${conv.driver_id}`, "message:new", payload);
    emitToRoom(`driver:${conv.driver_id}`, "conversation:update", {
      conversationId: conv.id,
      lastMessage: payload.message,
    });
  }
  if (conv.type === "rider_admin" && conv.rider_id) {
    emitToRoom(`rider:${conv.rider_id}`, "message:new", payload);
    emitToRoom(`rider:${conv.rider_id}`, "conversation:update", {
      conversationId: conv.id,
      lastMessage: payload.message,
    });
  }
}

async function sendMessage({
  user,
  conversationId,
  text,
  driverId,
  riderUserId,
}) {
  const trimmed = String(text || "").trim();
  if (!trimmed) throw new AppError(400, "Message is required");

  let conv;
  if (conversationId) {
    conv = await conversationModel.findById(conversationId);
    await assertConversationAccess(user, conv);
  } else if (user.role === "admin") {
    const adminId = user.id;
    if (driverId) {
      const d = await driverModel.findById(driverId);
      if (!d) throw new AppError(404, "Driver not found");
      conv = await findOrCreateDriverConversation(driverId, adminId);
    } else if (riderUserId) {
      conv = await findOrCreateRiderConversation(riderUserId, adminId);
    } else {
      throw new AppError(400, "driver_id or rider_user_id required for new thread");
    }
  } else {
    const admin = await getFirstAdminUser();
    if (!admin) throw new AppError(503, "No admin available for chat");
    if (user.role === "driver") {
      const d = await driverModel.findByUserId(user.id);
      if (!d) throw new AppError(404, "Driver profile not found");
      conv = await findOrCreateDriverConversation(d.id, admin.id);
    } else if (user.role === "rider") {
      conv = await findOrCreateRiderConversation(user.id, admin.id);
    } else {
      throw new AppError(403, "Cannot start conversation");
    }
  }

  const senderType = mapSenderType(user.role);
  const msgRow = await messageModel.insert({
    conversationId: conv.id,
    senderType,
    senderId: user.id,
    message: trimmed,
  });

  const u = await userModel.findById(user.id);
  const senderName = u?.name || "User";

  if (senderType === "driver" || senderType === "rider") {
    try {
      await adminNotificationModel.insertChat({
        adminUserId: conv.admin_id,
        title: `Yeni sohbet mesajı (${senderType})`,
        body: trimmed.slice(0, 240),
        payload: { conversationId: conv.id, messageId: msgRow.id },
      });
    } catch (e) {
      /* EKLENDİ — bildirim yazılamasa da mesaj kaydı kalır */
      console.error("admin notification insert", e);
    }
  }

  const freshConv = await conversationModel.findById(conv.id);
  await emitChatEvents(freshConv, { ...msgRow, sender_name: senderName }, senderName);

  return { message: msgRow, conversation: freshConv };
}

async function listConversationsAdmin(adminUserId) {
  const rows = await conversationModel.listForAdmin(adminUserId);
  let unreadTotal = 0;
  const conversations = rows.map((r) => {
    unreadTotal += Number(r.unread_for_admin) || 0;
    return {
      id: r.id,
      type: r.type,
      driver_id: r.driver_id,
      rider_id: r.rider_id,
      admin_id: r.admin_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
      peer_name: r.peer_name,
      peer_email: r.peer_email,
      unread_for_admin: Number(r.unread_for_admin) || 0,
      last_message: r.last_message_id
        ? {
            id: r.last_message_id,
            text: r.last_message_text,
            sender_type: r.last_message_sender_type,
            created_at: r.last_message_at,
          }
        : null,
    };
  });
  return { conversations, unreadTotal };
}

async function getMessages(user, conversationId) {
  const conv = await conversationModel.findById(conversationId);
  await assertConversationAccess(user, conv);
  const list = await messageModel.listByConversation(conversationId);
  return list.map((m) => ({
    id: m.id,
    conversation_id: m.conversation_id,
    sender_type: m.sender_type,
    sender_id: m.sender_id,
    sender_name: m.sender_name,
    message: m.message,
    is_read: m.is_read,
    created_at: m.created_at,
  }));
}

async function markRead(user, conversationId) {
  const conv = await conversationModel.findById(conversationId);
  await assertConversationAccess(user, conv);
  if (user.role === "admin") {
    await messageModel.markReadForAdmin(conversationId);
  } else {
    await messageModel.markReadForPeer(conversationId);
  }
  emitToAdmins("message:read", {
    conversationId,
    readerRole: user.role,
    readerId: user.id,
  });
  if (conv.type === "driver_admin" && conv.driver_id) {
    emitToRoom(`driver:${conv.driver_id}`, "message:read", {
      conversationId,
      readerRole: user.role,
      readerId: user.id,
    });
  }
  if (conv.type === "rider_admin" && conv.rider_id) {
    emitToRoom(`rider:${conv.rider_id}`, "message:read", {
      conversationId,
      readerRole: user.role,
      readerId: user.id,
    });
  }
  emitToAdmins("conversation:update", { conversationId, markedRead: true });
  return { ok: true };
}

async function unreadCounts(adminUserId) {
  const chatUnread = await messageModel.unreadTotalForAdmin(adminUserId);
  const notifUnread = await adminNotificationModel.unreadCount(adminUserId);
  return { chatUnread, notifUnread };
}

module.exports = {
  sendMessage,
  listConversationsAdmin,
  getMessages,
  markRead,
  unreadCounts,
  getFirstAdminUser,
};
