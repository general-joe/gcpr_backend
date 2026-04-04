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
    // Get distinct users the current user has messaged with
    const conversations = await prisma.$queryRaw`
      SELECT DISTINCT 
        CASE 
          WHEN "senderId" = ${userId} THEN "receiverId"
          ELSE "senderId"
        END as userId,
        u."fullName",
        u."profileImage",
        (
          SELECT content 
          FROM "directMessage" dm2
          WHERE 
            (dm2."senderId" = ${userId} AND dm2."receiverId" = 
              CASE 
                WHEN dm."senderId" = ${userId} THEN dm."receiverId"
                ELSE dm."senderId"
              END
            ) OR 
            (dm2."receiverId" = ${userId} AND dm2."senderId" = 
              CASE 
                WHEN dm."senderId" = ${userId} THEN dm."receiverId"
                ELSE dm."senderId"
              END
            )
          ORDER BY dm2."createdAt" DESC
          LIMIT 1
        ) as lastMessage,
        (
          SELECT "createdAt"
          FROM "directMessage" dm2
          WHERE 
            (dm2."senderId" = ${userId} AND dm2."receiverId" = 
              CASE 
                WHEN dm."senderId" = ${userId} THEN dm."receiverId"
                ELSE dm."senderId"
              END
            ) OR 
            (dm2."receiverId" = ${userId} AND dm2."senderId" = 
              CASE 
                WHEN dm."senderId" = ${userId} THEN dm."receiverId"
                ELSE dm."senderId"
              END
            )
          ORDER BY dm2."createdAt" DESC
          LIMIT 1
        ) as lastMessageAt,
        (
          SELECT COUNT(*)
          FROM "directMessage" dm2
          WHERE 
            dm2."receiverId" = ${userId} AND 
            dm2."senderId" = 
              CASE 
                WHEN dm."senderId" = ${userId} THEN dm."receiverId"
                ELSE dm."senderId"
              END AND
            dm2."status" = 'SENT'
        ) as unreadCount
      FROM "directMessage" dm
      JOIN "User" u ON 
        (CASE 
          WHEN dm."senderId" = ${userId} THEN dm."receiverId"
          ELSE dm."senderId"
        END) = u.id
      WHERE dm."senderId" = ${userId} OR dm."receiverId" = ${userId}
      GROUP BY 
        CASE 
          WHEN dm."senderId" = ${userId} THEN dm."receiverId"
          ELSE dm."senderId"
        END,
        u."fullName",
        u."profileImage"
      ORDER BY lastMessageAt DESC
    `;
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