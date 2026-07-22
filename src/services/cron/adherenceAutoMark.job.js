import prisma from "../../config/database.js";
import NotificationService from "../../modules/notification/notification.service.js";
import { getPatientCaregiverUserId } from "../clinical/clinicalAccess.service.js";

export async function runAdherenceAutoMarkJob() {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const result = await prisma.taskAdherenceLog.updateMany({
      where: {
        status: "PENDING",
        logDate: { lt: today }
      },
      data: {
        status: "MISSED"
      }
    });

    WRITE.info(`[AdherenceAutoMark] Marked ${result.count} logs as MISSED`);

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const todaysPendingLogs = await prisma.taskAdherenceLog.findMany({
      where: {
        status: "PENDING",
        logDate: { gte: today, lt: tomorrow },
      },
      include: {
        task: { select: { id: true, title: true } },
        patient: { select: { id: true, fullName: true } },
      },
    });

    const remindersByCaregiver = new Map();
    for (const log of todaysPendingLogs) {
      const caregiverUserId = await getPatientCaregiverUserId(log.patientId);
      if (!caregiverUserId) continue;
      const current = remindersByCaregiver.get(caregiverUserId) || [];
      current.push(log);
      remindersByCaregiver.set(caregiverUserId, current);
    }

    await Promise.all(
      [...remindersByCaregiver.entries()].map(([userId, logs]) =>
        NotificationService.createNotification({
          userId,
          type: "IN_APP",
          category: "TASK_REMINDER",
          title: "Today's Rehab Tasks",
          content: `You have ${logs.length} rehab task${logs.length === 1 ? "" : "s"} due today.`,
          relatedModel: "TaskAdherenceLog",
          data: {
            taskIds: logs.map((log) => log.taskId),
            patientIds: [...new Set(logs.map((log) => log.patientId))],
          },
        }),
      ),
    );

    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const missedLogs = await prisma.taskAdherenceLog.findMany({
      where: {
        status: "MISSED",
        logDate: { gte: yesterday, lt: today },
      },
      select: { patientId: true, taskId: true },
    });

    const missedByCaregiver = new Map();
    for (const log of missedLogs) {
      const caregiverUserId = await getPatientCaregiverUserId(log.patientId);
      if (!caregiverUserId) continue;
      missedByCaregiver.set(caregiverUserId, (missedByCaregiver.get(caregiverUserId) || 0) + 1);
    }

    await Promise.all(
      [...missedByCaregiver.entries()].map(([userId, count]) =>
        NotificationService.createNotification({
          userId,
          type: "IN_APP",
          category: "TASK_REMINDER",
          title: "Adherence Summary",
          content: `${count} rehab task log${count === 1 ? "" : "s"} were missed. Please review the care plan or contact your provider if support is needed.`,
          relatedModel: "TaskAdherenceLog",
          data: { missedCount: count },
        }),
      ),
    );
  } catch (e) {
    WRITE.error("[AdherenceAutoMark] Job failed", { error: e.message });
  }
}
