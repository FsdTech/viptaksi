/* EKLENDİ */
const chatService = require("../services/chat.service");
const { asyncHandler } = require("../middlewares/asyncHandler");

const listConversations = asyncHandler(async (req, res) => {
  const data = await chatService.listConversationsAdmin(req.user.id);
  res.json(data);
});

const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const messages = await chatService.getMessages(req.user, conversationId);
  res.json({ messages });
});

const send = asyncHandler(async (req, res) => {
  const {
    conversation_id: conversationId,
    message,
    driver_id: driverId,
    rider_user_id: riderUserId,
  } = req.body;
  const result = await chatService.sendMessage({
    user: req.user,
    conversationId,
    text: message,
    driverId,
    riderUserId,
  });
  res.status(201).json(result);
});

const markRead = asyncHandler(async (req, res) => {
  const { conversation_id: conversationId } = req.body;
  if (!conversationId) {
    const { AppError } = require("../utils/AppError");
    throw new AppError(400, "conversation_id required");
  }
  const result = await chatService.markRead(req.user, conversationId);
  res.json(result);
});

const unreadSummary = asyncHandler(async (req, res) => {
  const counts = await chatService.unreadCounts(req.user.id);
  res.json(counts);
});

module.exports = {
  listConversations,
  getMessages,
  send,
  markRead,
  unreadSummary,
};
