import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import ChatController from "./chat.controller.js";

const chatRouter = express.Router();

// Rate limiter for message sending (prevent abuse of the LLM API)
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 20,                  // max 20 messages per minute per IP
  message: {
    status: "error",
    message: "Too many messages. Please slow down and try again in a moment.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General chat rate limiter
const chatLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

// All chat endpoints are accessible by CAREGIVER and SERVICE_PROVIDER
const chatRoles = ["CAREGIVER", "SERVICE_PROVIDER"];

// POST /chat/quick — one-shot: create session + first message
chatRouter.post(
  "/quick",
  chatLimiter,
  authorize(chatRoles),
  messageLimiter,
  ChatController.quickStart
);

// POST /chat/sessions — create a new empty chat session
chatRouter.post(
  "/sessions",
  chatLimiter,
  authorize(chatRoles),
  ChatController.createSession
);

// GET /chat/sessions — list user's chat sessions
chatRouter.get(
  "/sessions",
  chatLimiter,
  authorize(chatRoles),
  ChatController.getSessions
);

// GET /chat/sessions/:sessionId — get single session metadata
chatRouter.get(
  "/sessions/:sessionId",
  chatLimiter,
  authorize(chatRoles),
  ChatController.getSession
);

// GET /chat/sessions/:sessionId/messages — paginated message history
chatRouter.get(
  "/sessions/:sessionId/messages",
  chatLimiter,
  authorize(chatRoles),
  ChatController.getMessages
);

// POST /chat/sessions/:sessionId/messages — send a message
chatRouter.post(
  "/sessions/:sessionId/messages",
  chatLimiter,
  authorize(chatRoles),
  messageLimiter,
  ChatController.sendMessage
);

// DELETE /chat/sessions/:sessionId — delete a session
chatRouter.delete(
  "/sessions/:sessionId",
  chatLimiter,
  authorize(chatRoles),
  ChatController.deleteSession
);

export default chatRouter;
