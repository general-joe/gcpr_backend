import prisma from "../../config/database.js";
import NotificationService from "../../modules/notification/notification.service.js";
import { sendMulticastPushNotification } from "../../utils/firebaseService.js";
import { SendSMS } from "../../utils/hubtel-sms.js";
import logger from "../../utils/logger.js";

export async function runTelehealthReminderJob() {
  try {
    const now = new Date();

    const rooms = await prisma.telehealthRoom.findMany({
      where: {
        status: "scheduled",
        scheduledStart: { gt: now }
      },
      include: {
        participants: {
          where: { userId: { not: null } },
          select: { userId: true }
        }
      }
    });

    for (const room of rooms) {
      const metadata = room.metadata || {};
      const reminders = Array.isArray(metadata.reminders) ? metadata.reminders : [];
      let updated = false;
      const start = new Date(room.scheduledStart).getTime();
      const fifteenMinutesBefore = start - 15 * 60 * 1000;
      const sentFifteenMinKey = "sent15MinPush";
      const alreadySent15 = metadata[sentFifteenMinKey] === true;

      for (const reminder of reminders) {
        if (reminder.sent) continue;
        if (new Date(reminder.at) <= now) {
          const participantUserIds = room.participants
            .map(p => p.userId)
            .filter(Boolean);

          const recipientIds = new Set(participantUserIds);
          if (room.creatorUserId) recipientIds.add(room.creatorUserId);
          if (room.providedByProviderId) {
            const sp = await prisma.serviceProvider.findUnique({
              where: { id: room.providedByProviderId },
              select: { userId: true }
            });
            if (sp?.userId) recipientIds.add(sp.userId);
          }

          for (const userId of recipientIds) {
            try {
              await NotificationService.createNotification({
                userId,
                type: "IN_APP",
                category: "APPOINTMENT_REMINDER",
                title: `Telehealth Reminder: ${room.title || "Session"}`,
                content: reminder.type === "1_HOUR"
                  ? `Your telehealth session starts in 1 hour. Join URL: ${room.joinUrl || "See app"}`
                  : `Your telehealth session starts in 15 minutes. Join URL: ${room.joinUrl || "See app"}`,
                relatedId: room.id,
                relatedModel: "TelehealthRoom",
                data: { joinUrl: room.joinUrl, roomId: room.id, reminderType: reminder.type },
                expiresAt: room.scheduledEnd ? new Date(new Date(room.scheduledEnd).getTime() + 60 * 60 * 1000) : null
              });
            } catch (e) {
              logger.warn("[TelehealthReminder] Notification failed", { userId, error: e.message });
            }
          }

          reminder.sent = true;
          updated = true;
        }
      }

      if (!alreadySent15 && now.getTime() >= fifteenMinutesBefore && now.getTime() <= start) {
        const participantUserIds = room.participants
          .map(p => p.userId)
          .filter(Boolean);

        const recipientIds = new Set(participantUserIds);
        if (room.creatorUserId) recipientIds.add(room.creatorUserId);

        for (const userId of recipientIds) {
          try {
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { id: true, email: true, phoneNumber: true, fullName: true }
            });
            if (!user) continue;

            const title = "Telehealth starting in 15 minutes";
            const body = `${room.title || "Your telehealth session"} starts soon.`;

            const tokens = await prisma.pushNotificationToken.findMany({
              where: { userId, isActive: true },
              select: { token: true }
            });
            if (tokens.length > 0) {
              await sendMulticastPushNotification(
                tokens.map(t => t.token),
                {
                  title,
                  body,
                  data: { roomId: room.id, joinUrl: room.joinUrl || '', type: 'telehealth_15min' }
                }
              );
            }

            if (user.phoneNumber) {
              await SendSMS(
                user.phoneNumber,
                `${title} ${body} Join URL: ${room.joinUrl || "See app"}`
              );
            }
          } catch (e) {
            logger.warn("[TelehealthReminder] 15-min push/SMS failed", { userId, error: e.message });
          }
        }

        metadata[sentFifteenMinKey] = true;
        updated = true;
      }

      if (updated) {
        await prisma.telehealthRoom.update({
          where: { id: room.id },
          data: { metadata }
        });
      }
    }
  } catch (e) {
    const code = e?.code;
    const message = String(e?.message ?? '');
    const isMissingSchema = code === 'P2021' || code === 'P2022' || /(?:table|relation).*required|does not exist|telehealth/i.test(message);
    if (isMissingSchema) {
      logger.warn("[TelehealthReminder] Skipping job; telehealth schema is unavailable", {
        code,
        error: message,
      });
      return;
    }

    logger.error("[TelehealthReminder] Job failed", { error: message });
  }
}
