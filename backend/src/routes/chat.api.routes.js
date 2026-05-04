/* EKLENDİ */
const { Router } = require("express");
const { authenticate } = require("../middlewares/authenticate");
const { authorizePanel } = require("../middlewares/authorizePanel");
const { requireSuperAdmin } = require("../middlewares/requireSuperAdmin");
const chatController = require("../controllers/chat.controller");

const router = Router();

router.get(
  "/conversations",
  authenticate,
  authorizePanel,
  chatController.listConversations
);

router.get(
  "/chat/unread-summary",
  authenticate,
  authorizePanel,
  chatController.unreadSummary
);

router.post("/messages/send", authenticate, authorizePanel, requireSuperAdmin, chatController.send);

router.post(
  "/messages/mark-read",
  authenticate,
  authorizePanel,
  requireSuperAdmin,
  chatController.markRead
);

router.get(
  "/messages/:conversationId",
  authenticate,
  chatController.getMessages
);

module.exports = router;
