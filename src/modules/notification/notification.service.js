import prisma from "../../config/database.js";
import { getIO } from "../../socket.io.js";
import {
  sendPushNotification,
  sendMulticastPushNotification,
} from "../../utils/firebaseService.js";

export default class NotificationService {
  static async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    const skip = (page - 1) * limit;
    
    const where = {
      userId,
      ...(unreadOnly && { status: "UNREAD" })
    };
    
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.notification.count({ where })
    ]);
    
    return {
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getUnreadCount(userId) {
    return await prisma.notification.count({
      where: {
        userId,
        status: "UNREAD"
      }
    });
  }

  static async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        status: "READ"
      }
    });
    
    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit('notification-update', {
        type: 'MARK_AS_READ',
        notificationId
      });
    }
    
    return notification;
  }

  static async markAllAsRead(userId) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        status: "UNREAD"
      },
      data: {
        status: "READ"
      }
    });
    
    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit('notification-update', {
        type: 'MARK_ALL_AS_READ',
        userId
      });
    }
    
    return result;
  }

  static async archive(notificationId, userId) {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        status: "ARCHIVED"
      }
    });
    
    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit('notification-update', {
        type: 'ARCHIVE',
        notificationId
      });
    }
    
    return notification;
  }

  static async deleteNotification(notificationId, userId) {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId
      }
    });
    
    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit('notification-update', {
        type: 'DELETE',
        notificationId
      });
    }
  }

  static async createNotification(notificationData) {
    const notification = await prisma.notification.create({
      data: notificationData
    });

    // Emit real-time notification via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user-${notificationData.userId}`).emit('new-notification', notification);

      // Also send a general notification update for badge count
      const unreadCount = await this.getUnreadCount(notificationData.userId);
      io.to(`user-${notificationData.userId}`).emit('notification-badge-update', {
        userId: notificationData.userId,
        count: unreadCount
      });
    }

    // Send push notification if user has push tokens
    if (notificationData.type === "PUSH" || notificationData.type === "IN_APP") {
      await this.sendPushNotificationToUser(notificationData.userId, notification);
    }

    return notification;
  }

  static async sendPushNotificationToUser(userId, notification) {
    try {
      // Get user's active push tokens
      const tokens = await prisma.pushNotificationToken.findMany({
        where: {
          userId,
          isActive: true
        }
      });

      if (tokens.length === 0) {
        return; // User has no active tokens
      }

      const firebaseTokens = tokens.map(t => t.token);

      // Send Firebase push notification
      const pushPayload = {
        title: notification.title || "GCPR Notification",
        body: notification.content || "You have a new notification",
        data: {
          notificationId: notification.id,
          category: notification.category,
          relatedId: notification.relatedId || "",
          relatedModel: notification.relatedModel || ""
        }
      };

      if (firebaseTokens.length === 1) {
        await sendPushNotification(firebaseTokens[0], pushPayload);
      } else {
        await sendMulticastPushNotification(firebaseTokens, pushPayload);
      }
    } catch (error) {
      // Log error but don't throw - push notification failure shouldn't block main flow
      console.error(`Failed to send push notification to user ${userId}:`, error.message);
    }
  }

  static async createDirectMessageNotification(message) {
    // Create notification for receiver
    await this.createNotification({
      userId: message.receiverId,
      type: "IN_APP",
      category: "DIRECT_MESSAGE",
      title: "New Direct Message",
      content: message.content ? 
        (message.content.length > 50 ? message.content.substring(0, 50) + "..." : message.content) : 
        "You have a new message",
      relatedId: message.id,
      relatedModel: "DirectMessage",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  }

  static async createCommunityMessageNotification(message) {
    // Get community members to notify (excluding sender)
    const members = await prisma.communityMember.findMany({
      where: {
        communityId: message.group ? undefined : message.communityId,
        ...(message.group && { groupId: message.groupId }),
        userId: { not: message.senderId },
        status: "ACTIVE"
      },
      select: { userId: true }
    });
    
    const truncatedContent = message.content
      ? (message.content.length > 50 ? message.content.substring(0, 50) + "..." : message.content)
      : "You have a new community message";

    // Create notifications for each member
    const notifications = members.map(member => ({
      userId: member.userId,
      type: "IN_APP",
      category: "COMMUNITY_MESSAGE",
      title: "New Community Message",
      content: truncatedContent,
      relatedId: message.id,
      relatedModel: "CommunityMessage",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }));
    
    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
      
      // Batch-fetch unread counts for all affected users in a single query
      const userIds = members.map(m => m.userId);
      const unreadCounts = await prisma.notification.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, status: "UNREAD" },
        _count: { id: true }
      });
      const countMap = new Map(unreadCounts.map(c => [c.userId, c._count.id]));

      // Emit real-time notifications via Socket.IO
      const io = getIO();
      if (io) {
        for (const notification of notifications) {
          io.to(`user-${notification.userId}`).emit('new-notification', notification);
          io.to(`user-${notification.userId}`).emit('notification-badge-update', {
            userId: notification.userId,
            count: countMap.get(notification.userId) || 0
          });
        }
      }
    }
  }

  static async createCommunityAnnouncementNotification(announcement) {
    // Get community members to notify
    const members = await prisma.communityMember.findMany({
      where: {
        communityId: announcement.communityId,
        status: "ACTIVE"
      },
      select: { userId: true }
    });
    
    const title = announcement.isPinned ? "Important Announcement" : "New Community Announcement";

    // Create notifications for each member
    const notifications = members.map(member => ({
      userId: member.userId,
      type: "IN_APP",
      category: "COMMUNITY_ANNOUNCEMENT",
      title,
      content: announcement.title,
      relatedId: announcement.id,
      relatedModel: "CommunityAnnouncement",
      expiresAt: announcement.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }));
    
    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
      
      // Batch-fetch unread counts for all affected users in a single query
      const userIds = members.map(m => m.userId);
      const unreadCounts = await prisma.notification.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, status: "UNREAD" },
        _count: { id: true }
      });
      const countMap = new Map(unreadCounts.map(c => [c.userId, c._count.id]));

      // Emit real-time notifications via Socket.IO
      const io = getIO();
      if (io) {
        for (const notification of notifications) {
          io.to(`user-${notification.userId}`).emit('new-notification', notification);
          io.to(`user-${notification.userId}`).emit('notification-badge-update', {
            userId: notification.userId,
            count: countMap.get(notification.userId) || 0
          });
        }
      }
    }
  }

  static async getPushToken(userId) {
    const tokenRecord = await prisma.pushNotificationToken.findFirst({
      where: {
        userId,
        isActive: true
      }
    });
    
    return tokenRecord ? tokenRecord.token : null;
  }

  static async registerPushToken(userId, token, deviceType, deviceId) {
    // Token has a @unique constraint in schema, use it directly
    await prisma.pushNotificationToken.upsert({
      where: { token },
      update: {
        userId,
        deviceType,
        deviceId,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        userId,
        token,
        deviceType: deviceType || "unknown",
        deviceId,
        isActive: true
      }
    });
  }

  static async removePushToken(userId) {
    await prisma.pushNotificationToken.updateMany({
      where: {
        userId
      },
      data: {
        isActive: false
      }
    });
  }

  static async deactivateAccount(userId) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: "DEACTIVATED"
      }
    });
    
    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit('account-status-changed', {
        userId,
        accountStatus: "DEACTIVATED"
      });
    }
    
    return user;
  }
}