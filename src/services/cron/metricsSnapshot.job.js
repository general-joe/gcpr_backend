import MetricsService from "../../modules/metrics/metrics.service.js";

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
    // Always compute daily snapshots
    const providerResults = await MetricsService.computeAllProviderSnapshots(
      now,
      "DAILY"
    );
    const systemSnap = await MetricsService.computeSystemSnapshot(now, "DAILY");

    const ok = providerResults.filter((r) => r.ok).length;
    const failed = providerResults.filter((r) => !r.ok).length;
    WRITE.info("[Cron] Daily snapshots done", {
      providers: { ok, failed },
      system: "ok",
    });

    // Weekly snapshots on Mondays (dayOfWeek === 1)
    if (now.getDay() === 1) {
      await MetricsService.computeAllProviderSnapshots(now, "WEEKLY");
      await MetricsService.computeSystemSnapshot(now, "WEEKLY");
      WRITE.info("[Cron] Weekly snapshots done");
    }

    // Monthly snapshots on 1st of month
    if (now.getDate() === 1) {
      await MetricsService.computeAllProviderSnapshots(now, "MONTHLY");
      await MetricsService.computeSystemSnapshot(now, "MONTHLY");
      WRITE.info("[Cron] Monthly snapshots done");
    }
  } catch (err) {
    WRITE.error("[Cron] Metrics snapshot job failed", { err: err.message });
  }
}
