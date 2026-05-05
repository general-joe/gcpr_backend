import OpenAI from "openai";
import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import { CAREGIVER_SYSTEM_PROMPT, buildSessionTitle } from "./chat.prompt.js";

// ─── Lazy OpenAI client ───────────────────────────────────────────────────────

let _openai = null;

function getOpenAI() {
  if (_openai) return _openai;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new gcprError(
      HttpStatus.SERVICE_UNAVAILABLE,
      "AI Chatbot is not configured. Please contact the platform administrator."
    );
  }

  _openai = new OpenAI({ apiKey });
  return _openai;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_HISTORY_MESSAGES = 20; // keep last 20 turns to stay within context window

async function loadHistory(sessionId) {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: MAX_HISTORY_MESSAGES,
  });

  return messages.map((m) => ({ role: m.role.toLowerCase(), content: m.content }));
}

// ─── ChatService ──────────────────────────────────────────────────────────────

class ChatService {
  // ── Create new session ────────────────────────────────────────────────────

  static async createSession(userId) {
    const session = await prisma.chatSession.create({
      data: { userId },
      select: { id: true, userId: true, title: true, createdAt: true },
    });

    WRITE.info("[Chat] Session created", { sessionId: session.id, userId });
    return session;
  }

  // ── List all sessions for user ────────────────────────────────────────────

  static async getSessions(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      prisma.chatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { content: true, role: true, createdAt: true },
          },
        },
      }),
      prisma.chatSession.count({ where: { userId } }),
    ]);

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        lastMessage: s.messages[0] ?? null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Get messages for a session ────────────────────────────────────────────

  static async getMessages(userId, sessionId, page = 1, limit = 50) {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Chat session not found");
    }

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        select: { id: true, role: true, content: true, tokens: true, createdAt: true },
      }),
      prisma.chatMessage.count({ where: { sessionId } }),
    ]);

    return {
      session: { id: session.id, title: session.title },
      messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Send a message (main chat endpoint) ──────────────────────────────────

  static async sendMessage(userId, sessionId, userMessage) {
    if (!userMessage || userMessage.trim().length === 0) {
      throw new gcprError(HttpStatus.BAD_REQUEST, "Message cannot be empty");
    }

    if (userMessage.length > 4000) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "Message is too long (max 4000 characters)"
      );
    }

    const trimmedMessage = userMessage.trim();

    // Validate session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true, title: true },
    });

    if (!session) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Chat session not found");
    }

    // Load conversation history
    const history = await loadHistory(sessionId);

    // Build messages array for OpenAI
    const openaiMessages = [
      { role: "system", content: CAREGIVER_SYSTEM_PROMPT },
      ...history,
      { role: "user", content: trimmedMessage },
    ];

    // Call OpenAI
    const openai = getOpenAI();
    let completion;

    try {
      completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: openaiMessages,
        max_tokens: 1024,
        temperature: 0.7,
      });
    } catch (err) {
      WRITE.error("[Chat] OpenAI API error", {
        sessionId,
        userId,
        err: err.message,
        status: err.status,
      });

      if (err.status === 401) {
        throw new gcprError(
          HttpStatus.SERVICE_UNAVAILABLE,
          "AI service configuration error. Please contact support."
        );
      }
      if (err.status === 429) {
        throw new gcprError(
          HttpStatus.TOO_MANY_REQUESTS,
          "AI service is busy. Please try again in a moment."
        );
      }
      throw new gcprError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "An error occurred with the AI service. Please try again."
      );
    }

    const assistantContent =
      completion.choices[0]?.message?.content?.trim() ??
      "I'm sorry, I couldn't generate a response. Please try again.";

    const promptTokens = completion.usage?.prompt_tokens ?? null;
    const completionTokens = completion.usage?.completion_tokens ?? null;

    // Persist both messages in a transaction
    const [userMsg, assistantMsg] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          sessionId,
          role: "USER",
          content: trimmedMessage,
          tokens: promptTokens,
        },
      }),
      prisma.chatMessage.create({
        data: {
          sessionId,
          role: "ASSISTANT",
          content: assistantContent,
          tokens: completionTokens,
        },
      }),
    ]);

    // Auto-set session title from first user message
    if (!session.title) {
      const title = buildSessionTitle(trimmedMessage);
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title, updatedAt: new Date() },
      });
    } else {
      // Touch updatedAt so the session bubbles up in the list
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    }

    WRITE.info("[Chat] Message exchange complete", {
      sessionId,
      userId,
      model: completion.model,
      promptTokens,
      completionTokens,
    });

    return {
      userMessage: { id: userMsg.id, role: "USER", content: trimmedMessage, createdAt: userMsg.createdAt },
      response: {
        id: assistantMsg.id,
        role: "ASSISTANT",
        content: assistantContent,
        createdAt: assistantMsg.createdAt,
        model: completion.model,
        tokensUsed: {
          prompt: promptTokens,
          completion: completionTokens,
          total: completion.usage?.total_tokens ?? null,
        },
      },
    };
  }

  // ── Quick-start: create session + send first message in one call ──────────

  static async startAndSend(userId, userMessage) {
    const session = await ChatService.createSession(userId);
    return ChatService.sendMessage(userId, session.id, userMessage);
  }

  // ── Delete a session ──────────────────────────────────────────────────────

  static async deleteSession(userId, sessionId) {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Chat session not found");
    }

    await prisma.chatSession.delete({ where: { id: sessionId } });

    return { deleted: true, id: sessionId };
  }

  // ── Get a single session summary ─────────────────────────────────────────

  static async getSession(userId, sessionId) {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    if (!session) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Chat session not found");
    }

    return session;
  }
}

export default ChatService;
