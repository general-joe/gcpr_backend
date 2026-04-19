import NotificationService from "../notification/notification.service.js";
import prisma from "../../config/database.js";
import { getIO } from "../../socket.io.js";

export default class DirectMessageService {
  static async sendMessage(messageData) {
    const message = await prisma.directMessage.create({
      data: messageData,
    });

    // Emit Socket.IO event for new message
    const io = getIO();
    if (io) {
      io.to(`user-${message.senderId}`).emit('new-direct-message', message);
      io.to(`user-${message.receiverId}`).emit('new-direct-message', message);
    }

    // Notify receiver
    await NotificationService.createNotification({
      userId: message.receiverId,
      type: "IN_APP",
      category: "DIRECT_MESSAGE",
      title: "New Direct Message",
      content: message.content ? (message.content.length > 50 ? message.content.substring(0, 50) + "..." : message.content) : "You have a new message",
      relatedId: message.id,
      relatedModel: "DirectMessage"
    });

    return message;
  }

  static async getMessagesBetweenUsers(userId, otherUserId) {
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    return messages;
  }

  static async getUserConversations(userId) {
    // Get all messages involving the user
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: { id: true, fullName: true, profileImage: true },
        },
        receiver: {
          select: { id: true, fullName: true, profileImage: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group by conversation partner and get the latest message
    const conversationMap = new Map();
    for (const message of messages) {
      const otherUser = message.senderId === userId ? message.receiver : message.sender;
      const conversationKey = otherUser.id;

      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          userId: otherUser.id,
          fullName: otherUser.fullName,
          profileImage: otherUser.profileImage,
          lastMessage: message.content || `[${message.type}]`,
          lastMessageAt: message.createdAt,
          unreadCount: 0,
        });
      }

      // Count unread messages from the other user to current user
      if (message.receiverId === userId && message.status === "SENT") {
        const conv = conversationMap.get(conversationKey);
        conv.unreadCount += 1;
      }
    }

    // Convert to array and sort by latest message
    const conversations = Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );

    return conversations;
  }

  static async markAsRead(messageId, userId) {
    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new gcprError(404, "Message not found");
    }

    if (message.receiverId !== userId) {
      throw new gcprError(403, "Unauthorized to mark this message as read");
    }

    const updated = await prisma.directMessage.update({
      where: { id: messageId },
      data: { status: "READ" },
    });
    
    // Emit Socket.IO event for message read status
    const io = getIO();
    if (io) {
      io.to(`user-${message.senderId}`).emit('message-read', {
        messageId: message.id,
        readerId: userId
      });
    }
    
    return updated;
  }

  static async deleteMessage(messageId, userId) {
    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new gcprError(404, "Message not found");
    }

    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new gcprError(403, "Unauthorized to delete this message");
    }
    
    await prisma.directMessage.delete({
      where: { id: messageId },
    });
    
    // Emit Socket.IO event for message deletion
    const io = getIO();
    if (io) {
      io.to(`user-${message.senderId}`).emit('message-deleted', { messageId });
      io.to(`user-${message.receiverId}`).emit('message-deleted', { messageId });
    }
  }
}