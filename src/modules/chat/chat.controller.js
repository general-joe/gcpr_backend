import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import ChatService from "./chat.service.js";

class ChatController {
  // POST /chat/sessions — create a new chat session
  static createSession = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const session = await ChatService.createSession(userId);
    UtilFunctions.outputSuccess(res, session, "Chat session created", 201);
  });

  // GET /chat/sessions — list all sessions for the current user
  static getSessions = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await ChatService.getSessions(userId, page, limit);
    UtilFunctions.outputSuccess(res, result, "Sessions retrieved");
  });

  // GET /chat/sessions/:sessionId — get session metadata
  static getSession = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { sessionId } = req.params;
    const result = await ChatService.getSession(userId, sessionId);
    UtilFunctions.outputSuccess(res, result, "Session retrieved");
  });

  // GET /chat/sessions/:sessionId/messages — paginated message history
  static getMessages = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { sessionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await ChatService.getMessages(userId, sessionId, page, limit);
    UtilFunctions.outputSuccess(res, result, "Messages retrieved");
  });

  // POST /chat/sessions/:sessionId/messages — send a message in an existing session
  static sendMessage = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { sessionId } = req.params;
    const { message } = req.body;
    const result = await ChatService.sendMessage(userId, sessionId, message);
    UtilFunctions.outputSuccess(res, result, "Message sent", 201);
  });

  // POST /chat/quick — create session + send first message in one shot (convenience)
  static quickStart = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { message } = req.body;
    const result = await ChatService.startAndSend(userId, message);
    UtilFunctions.outputSuccess(
      res,
      result,
      "Chat started successfully",
      201
    );
  });

  // DELETE /chat/sessions/:sessionId — delete a session + all its messages
  static deleteSession = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { sessionId } = req.params;
    const result = await ChatService.deleteSession(userId, sessionId);
    UtilFunctions.outputSuccess(res, result, "Session deleted");
  });
}

export default ChatController;
