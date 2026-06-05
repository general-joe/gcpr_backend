import prisma from "../../config/database.js";
import { getIO } from "../../socket.io.js";
import WRITE from "../../utils/logger.js";
import {
  sendPushNotification,
  sendMulticastPushNotification,
} from "../../utils/firebaseService.js";
import { enqueueJob } from "../../services/queue/queue.service.js";
import {
  NOTIFICATION_JOB_NAMES,
  QUEUE_NAMES,
} from "../../services/queue/queue.jobs.js";

export default class NotificationService {
  static async getUserNotifications(
    userId,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly && { status: "UNREAD" }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getUnreadCount(userId) {
    return await prisma.notification.count({
      where: {
        userId,
        status: "UNREAD",
      },
    });
  }

  static async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        status: "READ",
      },
    });

    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit("notification-update", {
        type: "MARK_AS_READ",
        notificationId,
      });
    }

    return notification;
  }

  static async markAllAsRead(userId) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        status: "UNREAD",
      },
      data: {
        status: "READ",
      },
    });

    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit("notification-update", {
        type: "MARK_ALL_AS_READ",
        userId,
      });
    }

    return result;
  }

  static async archive(notificationId, userId) {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        status: "ARCHIVED",
      },
    });

    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit("notification-update", {
        type: "ARCHIVE",
        notificationId,
      });
    }

    return notification;
  }

  static async deleteNotification(notificationId, userId) {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit("notification-update", {
        type: "DELETE",
        notificationId,
      });
    }
  }

  static async createNotification(notificationData) {
    const notification = await prisma.notification.create({
      data: notificationData,
    });

    const io = getIO();
    if (io) {
      io.to(`user-${notificationData.userId}`).emit(
        "new-notification",
        notification,
      );

      const unreadCount = await this.getUnreadCount(notificationData.userId);
      io.to(`user-${notificationData.userId}`).emit(
        "notification-badge-update",
        {
          userId: notificationData.userId,
          count: unreadCount,
        },
      );
    }

    await this.sendPushNotificationToUserNow(notificationData.userId, notification);

    return notification;
  }

  static async sendPushNotificationToUserNow(userId, notification) {
    try {
      WRITE.info("Sending push notification", {
        userId,
        notificationId: notification.id,
        category: notification.category,
        relatedModel: notification.relatedModel,
        relatedId: notification.relatedId,
      });

      const tokens = await prisma.pushNotificationToken.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      WRITE.debug("Found push tokens", {
        userId,
        tokenCount: tokens.length,
      });

      if (tokens.length === 0) {
        WRITE.warn("No active push tokens", {
          userId,
          notificationId: notification.id,
        });
        return;
      }

      const firebaseTokens = tokens.map((t) => t.token);

      const pushPayload = {
        title: notification.title || "GCPR Notification",
        body: notification.content || "You have a new notification",
        data: {
          notificationId: notification.id,
          category: notification.category,
          relatedId: notification.relatedId || "",
          relatedModel: notification.relatedModel || "",
        },
      };

      if (firebaseTokens.length === 1) {
        const response = await sendPushNotification(
          firebaseTokens[0],
          pushPayload,
        );
        WRITE.info("Push notification sent", {
          userId,
          notificationId: notification.id,
          tokenCount: firebaseTokens.length,
          response,
        });
        return response;
      }

      const response = await sendMulticastPushNotification(
        firebaseTokens,
        pushPayload,
      );
      WRITE.info("Multicast push notification sent", {
        userId,
        notificationId: notification.id,
        tokenCount: firebaseTokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });
      return response;
    } catch (error) {
      WRITE.error("Failed to send push notification", {
        error: error.message,
        userId,
        notificationId: notification.id,
      });
    }
  }

  static async getUnreadCount(userId) {
    return await prisma.notification.count({
      where: {
        userId,
        status: "UNREAD",
      },
    });
  }

  static async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        status: "READ",
      },
    });

    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit("notification-update", {
        type: "MARK_AS_READ",
        notificationId,
      });
    }

    return notification;
  }

  static async markAllAsRead(userId) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        status: "UNREAD",
      },
      data: {
        status: "READ",
      },
    });

    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit("notification-update", {
        type: "MARK_ALL_AS_READ",
        userId,
      });
    }

    return result;
  }

  static async archive(notificationId, userId) {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        status: "ARCHIVED",
      },
    });

    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit("notification-update", {
        type: "ARCHIVE",
        notificationId,
      });
    }

    return notification;
  }

  static async deleteNotification(notificationId, userId) {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit("notification-update", {
        type: "DELETE",
        notificationId,
      });
    }
  }

  static async createNotification(notificationData) {
    const notification = await prisma.notification.create({
      data: notificationData,
    });

    // Emit real-time notification via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user-${notificationData.userId}`).emit(
        "new-notification",
        notification,
      );

      // Also send a general notification update for badge count
      const unreadCount = await this.getUnreadCount(notificationData.userId);
      io.to(`user-${notificationData.userId}`).emit(
        "notification-badge-update",
        {
          userId: notificationData.userId,
          count: unreadCount,
        },
      );
    }

    await this.dispatchPushNotification(notificationData.userId, notification);

    return notification;
  }

  static async dispatchPushNotification(userId, notification) {
    WRITE.info("Notification dispatch started", {
      userId,
      notificationId: notification.id,
      notificationType: notification.type,
      category: notification.category,
    });
  }

  static async sendPushNotificationToUserNow(userId, notification) {
    try {
      WRITE.info("Sending push notification immediately", {
        userId,
        notificationId: notification.id,
        category: notification.category,
        relatedModel: notification.relatedModel,
        relatedId: notification.relatedId,
      });

      // Get user's active push tokens
      const tokens = await prisma.pushNotificationToken.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      WRITE.debug("Found push tokens for user", {
        userId,
        tokenCount: tokens.length,
      });

      if (tokens.length === 0) {
        WRITE.warn("No active push tokens for user", {
          userId,
          notificationId: notification.id,
        });
        return; // User has no active tokens
      }

      const firebaseTokens = tokens.map((t) => t.token);

      // Send Firebase push notification
      const pushPayload = {
        title: notification.title || "GCPR Notification",
        body: notification.content || "You have a new notification",
        data: {
          notificationId: notification.id,
          category: notification.category,
          relatedId: notification.relatedId || "",
          relatedModel: notification.relatedModel || "",
        },
      };

      if (firebaseTokens.length === 1) {
        const response = await sendPushNotification(
          firebaseTokens[0],
          pushPayload,
        );
        WRITE.info("Push notification sent to single token", {
          userId,
          notificationId: notification.id,
          tokenCount: firebaseTokens.length,
          response,
        });
        return response;
      }

      const response = await sendMulticastPushNotification(
        firebaseTokens,
        pushPayload,
      );
      WRITE.info("Multicast push notification sent", {
        userId,
        notificationId: notification.id,
        tokenCount: firebaseTokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });
      return response;
    } catch (error) {
      // Log error but don't throw - push notification failure shouldn't block main flow
      WRITE.error(`Failed to send push notification to user ${userId}`, {
        error: error.message,
        userId,
        notificationId: notification.id,
      });
    }
  }

  static async createDirectMessageNotification(message) {
    // Create notification for receiver
    await this.createNotification({
      userId: message.receiverId,
      type: "IN_APP",
      category: "DIRECT_MESSAGE",
      title: "New Direct Message",
      content: message.content
        ? message.content.length > 50
          ? message.content.substring(0, 50) + "..."
          : message.content
        : "You have a new message",
      relatedId: message.id,
      relatedModel: "DirectMessage",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
  }

  static async createCommunityMessageNotification(message) {
    // Get community members to notify (excluding sender)
    const members = await prisma.communityMember.findMany({
      where: {
        communityId: message.group ? undefined : message.communityId,
        ...(message.group && { groupId: message.groupId }),
        userId: { not: message.senderId },
        status: "ACTIVE",
      },
      select: { userId: true },
    });

    const truncatedContent = message.content
      ? message.content.length > 50
        ? message.content.substring(0, 50) + "..."
        : message.content
      : "You have a new community message";

    // Create notifications for each member
    const notifications = members.map((member) => ({
      userId: member.userId,
      type: "IN_APP",
      category: "COMMUNITY_MESSAGE",
      title: "New Community Message",
      content: truncatedContent,
      relatedId: message.id,
      relatedModel: "CommunityMessage",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });

      // Batch-fetch unread counts for all affected users in a single query
      const userIds = members.map((m) => m.userId);
      const unreadCounts = await prisma.notification.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, status: "UNREAD" },
        _count: { id: true },
      });
      const countMap = new Map(
        unreadCounts.map((c) => [c.userId, c._count.id]),
      );

      // Emit real-time notifications via Socket.IO
      const io = getIO();
      if (io) {
        for (const notification of notifications) {
          io.to(`user-${notification.userId}`).emit(
            "new-notification",
            notification,
          );
          io.to(`user-${notification.userId}`).emit(
            "notification-badge-update",
            {
              userId: notification.userId,
              count: countMap.get(notification.userId) || 0,
            },
          );
        }
      }

      // Send bulk push notifications to all affected users
      await this.sendBulkPushNotifications(userIds, {
        title: "New Community Message",
        content: truncatedContent,
        category: "COMMUNITY_MESSAGE",
        relatedId: message.id,
        relatedModel: "CommunityMessage",
      });
    }
  }

  static async createCommunityAnnouncementNotification(announcement) {
    // Get community members to notify
    const members = await prisma.communityMember.findMany({
      where: {
        communityId: announcement.communityId,
        status: "ACTIVE",
      },
      select: { userId: true },
    });

    const title = announcement.isPinned
      ? "Important Announcement"
      : "New Community Announcement";

    // Create notifications for each member
    const notifications = members.map((member) => ({
      userId: member.userId,
      type: "IN_APP",
      category: "COMMUNITY_ANNOUNCEMENT",
      title,
      content: announcement.title,
      relatedId: announcement.id,
      relatedModel: "CommunityAnnouncement",
      expiresAt:
        announcement.expiresAt ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });

      // Batch-fetch unread counts for all affected users in a single query
      const userIds = members.map((m) => m.userId);
      const unreadCounts = await prisma.notification.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, status: "UNREAD" },
        _count: { id: true },
      });
      const countMap = new Map(
        unreadCounts.map((c) => [c.userId, c._count.id]),
      );

      // Emit real-time notifications via Socket.IO
      const io = getIO();
      if (io) {
        for (const notification of notifications) {
          io.to(`user-${notification.userId}`).emit(
            "new-notification",
            notification,
          );
          io.to(`user-${notification.userId}`).emit(
            "notification-badge-update",
            {
              userId: notification.userId,
              count: countMap.get(notification.userId) || 0,
            },
          );
        }
      }

      // Send bulk push notifications to all affected users
      await this.sendBulkPushNotifications(userIds, {
        title,
        content: announcement.title,
        category: "COMMUNITY_ANNOUNCEMENT",
        relatedId: announcement.id,
        relatedModel: "CommunityAnnouncement",
      });
    }
  }

  static async sendBulkPushNotifications(userIds, payload) {
    try {
      if (!userIds || userIds.length === 0) {
        WRITE.warn("sendBulkPushNotifications called with empty user list");
        return;
      }

      const tokenRecords = await prisma.pushNotificationToken.findMany({
        where: { userId: { in: userIds }, isActive: true },
        select: { token: true },
      });

      WRITE.debug("Bulk push token lookup", {
        requestedUserIds: userIds,
        returnedTokens: tokenRecords.length,
      });

      if (!tokenRecords.length) {
        WRITE.warn("No active push tokens found for bulk notification", {
          userIds,
        });
        return;
      }

      const tokens = tokenRecords.map((r) => r.token);
      const pushPayload = {
        title: payload.title || "GCPR Notification",
        body: payload.content || "You have a new notification",
        data: {
          notificationId: "",
          category: payload.category || "",
          relatedId: payload.relatedId || "",
          relatedModel: payload.relatedModel || "",
        },
      };

      if (tokens.length === 1) {
        const response = await sendPushNotification(tokens[0], pushPayload);
        WRITE.info("Bulk push notification sent to single token", {
          tokenCount: tokens.length,
          response,
        });
      } else {
        const response = await sendMulticastPushNotification(
          tokens,
          pushPayload,
        );
        WRITE.info("Bulk multicast push notification sent", {
          tokenCount: tokens.length,
          successCount: response.successCount,
          failureCount: response.failureCount,
        });
      }
    } catch (error) {
      WRITE.error("Failed to send bulk push notifications", {
        error: error.message,
        userIds,
        category: payload.category,
      });
    }
  }

  static async getPushToken(userId) {
    const tokenRecord = await prisma.pushNotificationToken.findFirst({
      where: {
        userId,
        isActive: true,
      },
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
        updatedAt: new Date(),
      },
      create: {
        userId,
        token,
        deviceType: deviceType || "unknown",
        deviceId,
        isActive: true,
      },
    });
  }

  static async removePushToken(userId) {
    await prisma.pushNotificationToken.updateMany({
      where: {
        userId,
      },
      data: {
        isActive: false,
      },
    });
  }

  static async deactivateAccount(userId) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: "DEACTIVATED",
      },
    });

    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user-${userId}`).emit("account-status-changed", {
        userId,
        accountStatus: "DEACTIVATED",
      });
    }

    return user;
  }
}
