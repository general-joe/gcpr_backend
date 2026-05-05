import prisma from "../../config/database.js";

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
  } catch (e) {
    WRITE.error("[AdherenceAutoMark] Job failed", { error: e.message });
  }
}
