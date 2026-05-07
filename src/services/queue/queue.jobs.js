import MetricsService from "../../modules/metrics/metrics.service.js";
import NotificationService from "../../modules/notification/notification.service.js";
import { sendEmailNow } from "../../utils/emailSmtp.js";

export const QUEUE_NAMES = {
  EMAIL: "email-delivery",
  NOTIFICATION: "notification-delivery",
  METRICS: "metrics-compute",
};

export const EMAIL_JOB_NAMES = {
  SEND_TEMPLATE: "send-template-email",
};

export const NOTIFICATION_JOB_NAMES = {
  DELIVER_PUSH: "deliver-push-notification",
};

export const METRICS_JOB_NAMES = {
  COMPUTE_PROVIDER: "compute-provider-snapshot",
  COMPUTE_SYSTEM: "compute-system-snapshot",
  COMPUTE_ALL_PROVIDERS: "compute-all-provider-snapshots",
};

export async function processEmailJob(job) {
  if (job.name !== EMAIL_JOB_NAMES.SEND_TEMPLATE) {
    throw new Error(`Unsupported email job: ${job.name}`);
  }

  const { to, templateName, variables } = job.data;
  return sendEmailNow(to, templateName, variables);
}

export async function processNotificationJob(job) {
  if (job.name !== NOTIFICATION_JOB_NAMES.DELIVER_PUSH) {
    throw new Error(`Unsupported notification job: ${job.name}`);
  }

  const { userId, notification } = job.data;
  return NotificationService.sendPushNotificationToUserNow(userId, notification);
}

export async function processMetricsJob(job) {
  const { date, period = "DAILY" } = job.data;
  const snapshotDate = date ? new Date(date) : new Date();

  switch (job.name) {
    case METRICS_JOB_NAMES.COMPUTE_PROVIDER:
      return MetricsService.computeProviderSnapshot(
        job.data.providerId,
        snapshotDate,
        period,
      );

    case METRICS_JOB_NAMES.COMPUTE_SYSTEM:
      return MetricsService.computeSystemSnapshot(snapshotDate, period);

    case METRICS_JOB_NAMES.COMPUTE_ALL_PROVIDERS:
      return MetricsService.computeAllProviderSnapshots(snapshotDate, period);

    default:
      throw new Error(`Unsupported metrics job: ${job.name}`);
  }
}