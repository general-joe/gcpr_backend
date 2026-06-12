import cron from "node-cron";
import { runLicenseSync } from "./licenseSync.job.js";
import { runMetricsSnapshot } from "./metricsSnapshot.job.js";
import { runTelehealthReminderJob } from "./telehealthReminder.job.js";
import { runAdherenceAutoMarkJob } from "./adherenceAutoMark.job.js";
import { runReferralSlaJob } from "./referralSla.job.js";

export function startCronJobs() {
  cron.schedule("0 1 * * *", async () => {
    WRITE.info("[Cron] Running license sync job");
    await runLicenseSync();
  });

  cron.schedule("0 2 * * *", async () => {
    WRITE.info("[Cron] Running metrics snapshot job");
    await runMetricsSnapshot();
  });

  cron.schedule("* * * * *", async () => {
    await runTelehealthReminderJob();
  });

  cron.schedule("5 0 * * *", async () => {
    WRITE.info("[Cron] Running adherence auto-mark job");
    await runAdherenceAutoMarkJob();
  });

  cron.schedule("*/15 * * * *", async () => {
    await runReferralSlaJob();
  });

  WRITE.info("[Cron] All background jobs scheduled");
}
