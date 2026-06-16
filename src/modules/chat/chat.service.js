import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import { CAREGIVER_SYSTEM_PROMPT, buildSessionTitle } from "./chat.prompt.js";

// ─── Lazy Gemini client ───────────────────────────────────────────────────────

let _gemini = null;

function getGemini() {
  if (_gemini) return _gemini;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new gcprError(
      HttpStatus.SERVICE_UNAVAILABLE,
      "AI Chatbot is not configured. Please contact the platform administrator."
    );
  }

  _gemini = new GoogleGenerativeAI(apiKey);
  return _gemini;
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

async function callGeminiWithRetry(fn, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const shouldRetry =
        err.status === 429 ||
        (err.status >= 500 && err.status < 600);

      if (!shouldRetry || attempt === maxRetries - 1) {
        break;
      }

      const backoffMs = Math.min(1000 * 2 ** attempt + Math.random() * 1000, 15000);
      WRITE.warn("[Chat] Gemini transient error, retrying", {
        attempt: attempt + 1,
        backoffMs: Math.round(backoffMs),
        status: err.status,
        err: err.message,
      });
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  throw lastError;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_HISTORY_MESSAGES = 20; // keep last 20 turns to stay within context window

async function loadHistory(sessionId) {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: MAX_HISTORY_MESSAGES,
  });

  return messages.map((m) => ({
    role: m.role === "USER" ? "user" : "model",
    content: m.content,
  }));
}

/**
 * Convert history messages and system prompt into Gemini contents format.
 * Gemini expects: contents = [ { role: "user"|"model", parts: [{ text }] } ]
 * System instruction is passed separately.
 */
function buildGeminiContents(history, userMessage) {
  const contents = [];

  for (const msg of history) {
    contents.push({
      role: msg.role, // "user" or "model"
      parts: [{ text: msg.content }],
    });
  }

  // Add the new user message
  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  return contents;
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

    // Build Gemini contents array
    const contents = buildGeminiContents(history, trimmedMessage);

    // Call Gemini
    const gemini = getGemini();

    const genModel = gemini.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: CAREGIVER_SYSTEM_PROMPT,
    });

    let geminiResponse;

    try {
      const result = await callGeminiWithRetry(async () => {
        return genModel.generateContent({
          contents,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        });
      });

      // result is GenerateContentResult { response: EnhancedGenerateContentResponse }
      geminiResponse = result.response;
    } catch (err) {
      WRITE.error("[Chat] Gemini API error", {
        sessionId,
        userId,
        err: err.message,
        status: err.status,
      });

      if (err.status === 403 || err.status === 401) {
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

    // EnhancedGenerateContentResponse has a text() convenience method + candidates/usageMetadata
    const assistantContent =
      geminiResponse.text?.()?.trim() ??
      geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      "I'm sorry, I couldn't generate a response. Please try again.";

    const usageMetadata = geminiResponse.usageMetadata || {};
    const promptTokens = usageMetadata.promptTokenCount ?? null;
    const completionTokens = usageMetadata.candidatesTokenCount ?? null;
    const model = "gemini-2.0-flash";

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
      model,
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
        model,
        tokensUsed: {
          prompt: promptTokens,
          completion: completionTokens,
          total: usageMetadata.totalTokenCount ?? null,
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