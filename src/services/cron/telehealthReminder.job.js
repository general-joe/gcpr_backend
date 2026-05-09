import prisma from "../../config/database.js";
import NotificationService from "../../modules/notification/notification.service.js";

export async function runTelehealthReminderJob() {
  try {
    const now = new Date();

    // Get all scheduled rooms with future start times
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

      for (const reminder of reminders) {
        if (reminder.sent) continue;
        if (new Date(reminder.at) <= now) {
          // Send notification to all participants
          const participantUserIds = room.participants
            .map(p => p.userId)
            .filter(Boolean);

          for (const userId of participantUserIds) {
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
              WRITE.warn("[TelehealthReminder] Notification failed", { userId, error: e.message });
            }
          }

          reminder.sent = true;
          updated = true;
        }
      }

      if (updated) {
        await prisma.telehealthRoom.update({
          where: { id: room.id },
          data: { metadata: { ...metadata, reminders } }
        });
      }
    }
  } catch (e) {
    if (e?.code === "P2021" || e?.code === "P2022") {
      WRITE.warn("[TelehealthReminder] Skipping job; telehealth schema is unavailable", {
        code: e.code,
        error: e.message,
      });
      return;
    }

    WRITE.error("[TelehealthReminder] Job failed", { error: e.message });
  }
}
