import prisma from "../../config/database.js";
import NotificationService from "../../modules/notification/notification.service.js";
import logger from "../../utils/logger.js";

/**
 * Telehealth Reminder Job
 *
 * Single source of truth for all telehealth reminders.
 * Uses the `reminders` array stored in room.metadata to determine
 * which reminders to send and when.
 *
 * Each reminder has:
 *   - at: ISO timestamp of when the reminder should fire
 *   - sent: boolean indicating if it has been sent
 *   - type: "1_HOUR" | "15_MIN"
 *
 * This eliminates the duplicate 15-minute reminder path that previously
 * existed as a separate `sent15MinPush` flag in metadata.
 */
export async function runTelehealthReminderJob() {
  try {
    const now = new Date();

    const rooms = await prisma.telehealthRoom.findMany({
      where: {
        status: "scheduled",
        scheduledStart: { gt: now },
        deletedAt: null // Exclude soft-deleted rooms
      },
      include: {
        participants: {
          where: { userId: { not: null } },
          select: { userId: true }
        }
      }
    });

    logger.info("[TelehealthReminder] Job started", {
      roomCount: rooms.length,
      now: now.toISOString()
    });

    for (const room of rooms) {
      const metadata = room.metadata || {};
      const reminders = Array.isArray(metadata.reminders) ? metadata.reminders : [];
      let updated = false;

      for (const reminder of reminders) {
        // Skip already-sent reminders
        if (reminder.sent) continue;

        // Check if it's time to send this reminder
        if (new Date(reminder.at) <= now) {
          const participantUserIds = room.participants
            .map(p => p.userId)
            .filter(Boolean);

          const recipientIds = new Set(participantUserIds);
          if (room.creatorUserId) recipientIds.add(room.creatorUserId);
          if (room.providedByProviderId) {
            try {
              const sp = await prisma.serviceProvider.findUnique({
                where: { id: room.providedByProviderId },
                select: { userId: true }
              });
              if (sp?.userId) recipientIds.add(sp.userId);
            } catch (e) {
              logger.error("[TelehealthReminder] Failed to lookup provider", {
                providerId: room.providedByProviderId,
                error: e.message
              });
            }
          }

          const reminderLabel = reminder.type === "1_HOUR" ? "1 hour" : "15 minutes";
          const content = `Your telehealth session starts in ${reminderLabel}. Join URL: ${room.joinUrl || "See app"}`;

          for (const userId of recipientIds) {
            try {
              // Check for existing notification to prevent duplicates (idempotency)
              const existingNotif = await prisma.notification.findFirst({
                where: {
                  userId,
                  category: "APPOINTMENT_REMINDER",
                  relatedId: room.id,
                  createdAt: { gte: new Date(Date.now() - 60 * 1000) } // within last minute
                },
                select: { id: true }
              });

              if (existingNotif) {
                logger.info("[TelehealthReminder] Notification already sent, skipping", {
                  userId,
                  roomId: room.id,
                  reminderType: reminder.type
                });
                continue;
              }

              await NotificationService.createNotification({
                userId,
                type: "IN_APP",
                category: "APPOINTMENT_REMINDER",
                title: `Telehealth Reminder: ${room.title || "Session"}`,
                content,
                relatedId: room.id,
                relatedModel: "TelehealthRoom",
                data: { joinUrl: room.joinUrl, roomId: room.id, reminderType: reminder.type },
                expiresAt: room.scheduledEnd
                  ? new Date(new Date(room.scheduledEnd).getTime() + 60 * 60 * 1000)
                  : null
              });

              logger.info("[TelehealthReminder] Notification sent", {
                userId,
                roomId: room.id,
                reminderType: reminder.type
              });
            } catch (e) {
              logger.error("[TelehealthReminder] Notification failed", {
                userId,
                roomId: room.id,
                reminderType: reminder.type,
                error: e.message,
                stack: e.stack
              });
            }
          }

          // Mark reminder as sent
          reminder.sent = true;
          updated = true;

          logger.info("[TelehealthReminder] Reminder marked as sent", {
            roomId: room.id,
            reminderType: reminder.type,
            recipientCount: recipientIds.size
          });
        }
      }

      // Persist metadata updates if any reminders were sent
      if (updated) {
        try {
          await prisma.telehealthRoom.update({
            where: { id: room.id },
            data: { metadata }
          });
          logger.info("[TelehealthReminder] Metadata persisted", { roomId: room.id });
        } catch (e) {
          logger.error("[TelehealthReminder] Failed to persist metadata", {
            roomId: room.id,
            error: e.message,
            prismaCode: e.code,
            prismaMeta: e.meta,
            stack: e.stack
          });
        }
      }
    }

    logger.info("[TelehealthReminder] Job completed", {
      roomCount: rooms.length
    });
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

    logger.error("[TelehealthReminder] Job failed", {
      error: message,
      prismaCode: code,
      prismaMeta: e?.meta,
      stack: e?.stack
    });
  }
}