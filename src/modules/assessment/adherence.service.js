import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";

class AdherenceService {
  static async requireServiceProvider(userId) {
    const sp = await prisma.serviceProvider.findUnique({ where: { userId }, select: { id: true } });
    if (!sp) throw new gcprError(HttpStatus.NOT_FOUND, "Service provider profile not found");
    return sp;
  }

  static async requireCaregiver(userId) {
    const cg = await prisma.careGiver.findUnique({ where: { userId }, select: { id: true } });
    if (!cg) throw new gcprError(HttpStatus.NOT_FOUND, "Caregiver profile not found");
    return cg;
  }

  /**
   * Auto-generate TaskAdherenceLog entries for every day in task duration.
   * Called after task creation.
   */
  static async generateAdherenceLogs(task) {
    if (!task.startDate || !task.endDate) return;

    const start = new Date(task.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(task.endDate);
    end.setUTCHours(0, 0, 0, 0);

    const logs = [];
    const current = new Date(start);
    while (current <= end) {
      logs.push({
        taskId: task.id,
        patientId: task.patientId,
        providerId: task.providerId,
        logDate: new Date(current),
        status: "PENDING"
      });
      current.setUTCDate(current.getUTCDate() + 1);
    }

    if (logs.length > 0) {
      await prisma.taskAdherenceLog.createMany({ data: logs, skipDuplicates: true });
    }
  }

  static async getLogsForTask(user, taskId, query = {}) {
    const { page = 1, limit = 30 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const task = await prisma.rehabTask.findUnique({ where: { id: taskId } });
    if (!task) throw new gcprError(HttpStatus.NOT_FOUND, "Task not found");

    const [logs, total] = await Promise.all([
      prisma.taskAdherenceLog.findMany({
        where: { taskId },
        skip,
        take,
        orderBy: { logDate: "asc" }
      }),
      prisma.taskAdherenceLog.count({ where: { taskId } })
    ]);

    return {
      data: logs,
      pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) }
    };
  }

  static async markLogCompleted(user, taskId, data) {
    const { logDate, notes } = data;
    const logDateObj = new Date(logDate);
    logDateObj.setUTCHours(0, 0, 0, 0);

    const task = await prisma.rehabTask.findUnique({ where: { id: taskId } });
    if (!task) throw new gcprError(HttpStatus.NOT_FOUND, "Task not found");

    const log = await prisma.taskAdherenceLog.upsert({
      where: { taskId_logDate: { taskId, logDate: logDateObj } },
      create: {
        taskId,
        patientId: task.patientId,
        providerId: task.providerId,
        logDate: logDateObj,
        status: "COMPLETED",
        markedById: user.id,
        markedAt: new Date(),
        notes: notes || null
      },
      update: {
        status: "COMPLETED",
        markedById: user.id,
        markedAt: new Date(),
        notes: notes !== undefined ? notes : undefined
      }
    });

    return log;
  }

  static async updateLog(user, taskId, logId, data) {
    if (user.userType !== "SERVICE_PROVIDER") throw new gcprError(HttpStatus.FORBIDDEN, "Only service providers can update logs");

    const log = await prisma.taskAdherenceLog.findFirst({ where: { id: logId, taskId } });
    if (!log) throw new gcprError(HttpStatus.NOT_FOUND, "Adherence log not found");

    const updateData = {};
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    updateData.markedById = user.id;
    updateData.markedAt = new Date();

    return prisma.taskAdherenceLog.update({ where: { id: logId }, data: updateData });
  }

  static async getPatientSummary(user, patientId, query = {}) {
    const patient = await prisma.cpPatient.findUnique({ where: { id: patientId }, select: { id: true } });
    if (!patient) throw new gcprError(HttpStatus.NOT_FOUND, "Patient not found");

    const tasks = await prisma.rehabTask.findMany({
      where: { patientId, status: { not: "COMPLETED" } },
      select: { id: true, title: true, startDate: true, endDate: true }
    });

    const taskIds = tasks.map(t => t.id);
    const allLogs = await prisma.taskAdherenceLog.findMany({
      where: { patientId, taskId: { in: taskIds } },
      select: { taskId: true, status: true }
    });

    const totalLogs = allLogs.length;
    const completedLogs = allLogs.filter(l => l.status === "COMPLETED").length;
    const missedLogs = allLogs.filter(l => l.status === "MISSED").length;
    const adherenceRate = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;

    // Task breakdown
    const taskBreakdown = tasks.map(task => {
      const taskLogs = allLogs.filter(l => l.taskId === task.id);
      const tc = taskLogs.filter(l => l.status === "COMPLETED").length;
      const tm = taskLogs.filter(l => l.status === "MISSED").length;
      const tt = taskLogs.length;
      return {
        taskId: task.id,
        title: task.title,
        totalLogs: tt,
        completedLogs: tc,
        missedLogs: tm,
        adherenceRate: tt > 0 ? Math.round((tc / tt) * 100) : 0
      };
    });

    return {
      patientId,
      totalTasks: tasks.length,
      totalLogs,
      completedLogs,
      missedLogs,
      adherenceRate,
      taskBreakdown
    };
  }

  static async getCalendarView(user, taskId) {
    const task = await prisma.rehabTask.findUnique({ where: { id: taskId } });
    if (!task) throw new gcprError(HttpStatus.NOT_FOUND, "Task not found");

    const logs = await prisma.taskAdherenceLog.findMany({
      where: { taskId },
      orderBy: { logDate: "asc" },
      select: { logDate: true, status: true }
    });

    return {
      taskId,
      taskTitle: task.title,
      startDate: task.startDate,
      endDate: task.endDate,
      calendar: logs.map(l => ({
        date: l.logDate,
        status: l.status
      }))
    };
  }
}

export default AdherenceService;
