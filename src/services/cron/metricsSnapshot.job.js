import MetricsService from "../../modules/metrics/metrics.service.js";
import { enqueueJob } from "../queue/queue.service.js";
import {
  METRICS_JOB_NAMES,
  QUEUE_NAMES,
} from "../queue/queue.jobs.js";

/**
 * Computes daily DAILY snapshots for all providers and the system.
 * Also computes WEEKLY snapshots on Mondays.
 * Also computes MONTHLY snapshots on the 1st of each month.
 */
export async function runMetricsSnapshot() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  WRITE.info("[Cron] Starting metrics snapshot computation", {
    date: now.toISOString(),
  });

  try {
    const queueDate = now.toISOString();

    const queuedDailyProvider = await enqueueJob(
      QUEUE_NAMES.METRICS,
      METRICS_JOB_NAMES.COMPUTE_ALL_PROVIDERS,
      { date: queueDate, period: "DAILY" },
      { jobId: `cron:metrics:all-providers:DAILY:${queueDate}` },
    );
    const queuedDailySystem = await enqueueJob(
      QUEUE_NAMES.METRICS,
      METRICS_JOB_NAMES.COMPUTE_SYSTEM,
      { date: queueDate, period: "DAILY" },
      { jobId: `cron:metrics:system:DAILY:${queueDate}` },
    );

    if (queuedDailyProvider.queued && queuedDailySystem.queued) {
      WRITE.info("[Cron] Daily snapshots queued", {
        providerJobId: queuedDailyProvider.jobId,
        systemJobId: queuedDailySystem.jobId,
      });
    } else {
      const providerResults = await MetricsService.computeAllProviderSnapshots(
        now,
        "DAILY"
      );
      const systemSnap = await MetricsService.computeSystemSnapshot(now, "DAILY");

      const ok = providerResults.filter((r) => r.ok).length;
      const failed = providerResults.filter((r) => !r.ok).length;
      WRITE.info("[Cron] Daily snapshots done", {
        providers: { ok, failed },
        system: systemSnap ? "ok" : "unknown",
      });
    }

    // Weekly snapshots on Mondays (dayOfWeek === 1)
    if (now.getDay() === 1) {
      const weeklyProviderJob = await enqueueJob(
        QUEUE_NAMES.METRICS,
        METRICS_JOB_NAMES.COMPUTE_ALL_PROVIDERS,
        { date: queueDate, period: "WEEKLY" },
        { jobId: `cron:metrics:all-providers:WEEKLY:${queueDate}` },
      );
      const weeklySystemJob = await enqueueJob(
        QUEUE_NAMES.METRICS,
        METRICS_JOB_NAMES.COMPUTE_SYSTEM,
        { date: queueDate, period: "WEEKLY" },
        { jobId: `cron:metrics:system:WEEKLY:${queueDate}` },
      );

      if (weeklyProviderJob.queued && weeklySystemJob.queued) {
        WRITE.info("[Cron] Weekly snapshots queued", {
          providerJobId: weeklyProviderJob.jobId,
          systemJobId: weeklySystemJob.jobId,
        });
      } else {
        await MetricsService.computeAllProviderSnapshots(now, "WEEKLY");
        await MetricsService.computeSystemSnapshot(now, "WEEKLY");
        WRITE.info("[Cron] Weekly snapshots done");
      }
    }

    // Monthly snapshots on 1st of month
    if (now.getDate() === 1) {
      const monthlyProviderJob = await enqueueJob(
        QUEUE_NAMES.METRICS,
        METRICS_JOB_NAMES.COMPUTE_ALL_PROVIDERS,
        { date: queueDate, period: "MONTHLY" },
        { jobId: `cron:metrics:all-providers:MONTHLY:${queueDate}` },
      );
      const monthlySystemJob = await enqueueJob(
        QUEUE_NAMES.METRICS,
        METRICS_JOB_NAMES.COMPUTE_SYSTEM,
        { date: queueDate, period: "MONTHLY" },
        { jobId: `cron:metrics:system:MONTHLY:${queueDate}` },
      );

      if (monthlyProviderJob.queued && monthlySystemJob.queued) {
        WRITE.info("[Cron] Monthly snapshots queued", {
          providerJobId: monthlyProviderJob.jobId,
          systemJobId: monthlySystemJob.jobId,
        });
      } else {
        await MetricsService.computeAllProviderSnapshots(now, "MONTHLY");
        await MetricsService.computeSystemSnapshot(now, "MONTHLY");
        WRITE.info("[Cron] Monthly snapshots done");
      }
    }
  } catch (err) {
    WRITE.error("[Cron] Metrics snapshot job failed", { err: err.message });
  }
}
