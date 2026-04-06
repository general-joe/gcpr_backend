import UtilFunctions from "../../utils/UtilFunctions.js";
import DirectMessageService from "./directMessage.service.js";
import catchAsync from "../../middlewares/catchAsync.js";

export default class DirectMessageController {
  static sendMessage = catchAsync(async (req, res) => {
    const senderId = res.locals.user.id;
    const { receiverId, content, mediaUrl, type, caption } = req.body;

    // Validate input
    if (!receiverId) {
      return UtilFunctions.outputError(res, "Receiver ID is required");
    }

    if (!content && !mediaUrl) {
      return UtilFunctions.outputError(res, "Message content or media is required");
    }

    // Prevent sending message to self
    if (senderId === receiverId) {
      return UtilFunctions.outputError(res, "Cannot send message to yourself");
    }

    const messageData = {
      senderId,
      receiverId,
      content: content || null,
      mediaUrl: mediaUrl || null,
      caption: caption || null,
      type: type || "TEXT",
    };

    const message = await DirectMessageService.sendMessage(messageData);
    UtilFunctions.outputSuccess(res, message, "Message sent successfully");
  });

  static getMessagesWithUser = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { userId: otherUserId } = req.params;

    if (!otherUserId) {
      return UtilFunctions.outputError(res, "Other user ID is required");
    }

    const messages = await DirectMessageService.getMessagesBetweenUsers(
      userId,
      otherUserId
    );
    UtilFunctions.outputSuccess(res, messages, "Messages retrieved successfully");
  });

  static getConversations = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const conversations = await DirectMessageService.getUserConversations(userId);
    UtilFunctions.outputSuccess(res, conversations, "Conversations retrieved successfully");
  });

  static markAsRead = catchAsync(async (req, res) => {
    const { messageId } = req.params;
    const userId = res.locals.user.id;

    const updatedMessage = await DirectMessageService.markAsRead(messageId, userId);
    UtilFunctions.outputSuccess(res, updatedMessage, "Message marked as read");
  });

  static deleteMessage = catchAsync(async (req, res) => {
    const { messageId } = req.params;
    const userId = res.locals.user.id;

    await DirectMessageService.deleteMessage(messageId, userId);
    UtilFunctions.outputSuccess(res, {}, "Message deleted successfully");
  });
}