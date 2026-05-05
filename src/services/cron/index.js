import cron from "node-cron";
import { runLicenseSync } from "./licenseSync.job.js";
import { runMetricsSnapshot } from "./metricsSnapshot.job.js";
import { runTelehealthReminderJob } from "./telehealthReminder.job.js";
import { runAdherenceAutoMarkJob } from "./adherenceAutoMark.job.js";

/**
 * Starts all background cron jobs.
 * Call this once from index.js after the server starts.
 */
export function startCronJobs() {
  // Daily at 01:00 — sync license statuses for all service providers
  cron.schedule("0 1 * * *", async () => {
    WRITE.info("[Cron] Running license sync job");
    await runLicenseSync();
  });

  // Daily at 02:00 — compute metrics snapshots (daily, weekly on Mon, monthly on 1st)
  cron.schedule("0 2 * * *", async () => {
    WRITE.info("[Cron] Running metrics snapshot job");
    await runMetricsSnapshot();
  });

  // Every minute — telehealth session reminders
  cron.schedule("* * * * *", async () => {
    await runTelehealthReminderJob();
  });

  // Daily at 00:05 UTC — auto-mark missed adherence logs
  cron.schedule("5 0 * * *", async () => {
    WRITE.info("[Cron] Running adherence auto-mark job");
    await runAdherenceAutoMarkJob();
  });

  WRITE.info("[Cron] All background jobs scheduled");
}
