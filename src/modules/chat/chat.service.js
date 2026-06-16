import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import { CAREGIVER_SYSTEM_PROMPT, buildSessionTitle } from "./chat.prompt.js";

// ─── Lazy Gemini client ───────────────────────────────────────────────────────

let _gemini = null;

const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-1.5-flash";

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

// ─── Concurrency limiter (semaphore) ──────────────────────────────────────────

const MAX_CONCURRENT_GEMINI = parseInt(process.env.GEMINI_MAX_CONCURRENT, 10) || 3;
let _activeRequests = 0;
const _waitQueue = [];

function _acquireSlot() {
  return new Promise((resolve) => {
    if (_activeRequests < MAX_CONCURRENT_GEMINI) {
      _activeRequests++;
      resolve();
    } else {
      _waitQueue.push(resolve);
    }
  });
}

function _releaseSlot() {
  if (_waitQueue.length > 0) {
    // Don't decrement — hand the slot to the next waiter
    const next = _waitQueue.shift();
    next();
  } else {
    _activeRequests--;
  }
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

async function callGeminiWithRetry(fn, maxRetries = 5) {
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

      // Exponential back-off: 2s, 4s, 8s, 16s … capped at 30s + jitter
      const backoffMs = Math.min(2000 * 2 ** attempt + Math.random() * 1000, 30000);
      WRITE.warn("[Chat] Gemini transient error, retrying", {
        attempt: attempt + 1,
        maxRetries,
        backoffMs: Math.round(backoffMs),
        status: err.status,
        statusText: err.statusText,
        err: err.message,
        errorDetails: err.errorDetails || null,
        model: fn._modelName || "unknown",
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

    // Call Gemini with concurrency limiter and model fallback
    const gemini = getGemini();

    let geminiResponse;
    let activeModel = PRIMARY_MODEL;
    let lastError;

    // Try primary model first, then fallback on 429
    const modelsToTry = PRIMARY_MODEL === FALLBACK_MODEL
      ? [PRIMARY_MODEL]
      : [PRIMARY_MODEL, FALLBACK_MODEL];

    for (const modelName of modelsToTry) {
      activeModel = modelName;

      const genModel = gemini.getGenerativeModel({
        model: modelName,
        systemInstruction: CAREGIVER_SYSTEM_PROMPT,
      });

      // Tag the retry function with model name for logging
      const geminiCall = async () => {
        return genModel.generateContent({
          contents,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        });
      };
      geminiCall._modelName = modelName;

      await _acquireSlot();
      try {
        const result = await callGeminiWithRetry(geminiCall);
        geminiResponse = result.response;
        lastError = null;
        break; // success — exit the model loop
      } catch (err) {
        lastError = err;

        WRITE.error("[Chat] Gemini API error after retries", {
          sessionId,
          userId,
          model: modelName,
          status: err.status,
          statusText: err.statusText,
          err: err.message,
          errorDetails: err.errorDetails || null,
        });

        // If 429 on primary model, try fallback
        if (err.status === 429 && modelName === PRIMARY_MODEL && modelName !== FALLBACK_MODEL) {
          WRITE.warn("[Chat] Primary model rate-limited, trying fallback", {
            primaryModel: PRIMARY_MODEL,
            fallbackModel: FALLBACK_MODEL,
          });
          continue; // try next model
        }

        // Non-retryable or fallback also failed — break out
        break;
      } finally {
        _releaseSlot();
      }
    }

    // If all models failed, throw appropriate error
    if (lastError) {
      if (lastError.status === 403 || lastError.status === 401) {
        throw new gcprError(
          HttpStatus.SERVICE_UNAVAILABLE,
          "AI service configuration error. Please contact support."
        );
      }
      if (lastError.status === 429) {
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
    const model = activeModel;

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