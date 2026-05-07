import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import MetricsService from "./metrics.service.js";
import { enqueueJob } from "../../services/queue/queue.service.js";
import {
  METRICS_JOB_NAMES,
  QUEUE_NAMES,
} from "../../services/queue/queue.jobs.js";

class MetricsController {
  // GET /metrics/provider — own metrics (SERVICE_PROVIDER)
  static getProviderMetrics = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const { period = "DAILY", date } = req.query;
    const result = await MetricsService.getProviderMetrics(user.id, period, date);
    UtilFunctions.outputSuccess(res, result, "Provider metrics retrieved");
  });

  // GET /metrics/patient/:patientId — patient metrics
  static getPatientMetrics = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const { patientId } = req.params;
    const { period = "WEEKLY", date } = req.query;
    const result = await MetricsService.getPatientMetrics(
      user.id,
      patientId,
      period,
      date
    );
    UtilFunctions.outputSuccess(res, result, "Patient metrics retrieved");
  });

  // GET /metrics/system — system-wide metrics (ADMIN)
  static getSystemMetrics = catchAsync(async (req, res) => {
    const { period = "DAILY", date } = req.query;
    const result = await MetricsService.getSystemMetrics(period, date);
    UtilFunctions.outputSuccess(res, result, "System metrics retrieved");
  });

  // POST /metrics/compute/provider — admin: trigger computation for own or specified provider
  static computeProviderSnapshot = catchAsync(async (req, res) => {
    const { providerId, date, period = "DAILY" } = req.body;
    const snapshotDate = date ? new Date(date) : new Date();
    const result = await enqueueJob(
      QUEUE_NAMES.METRICS,
      METRICS_JOB_NAMES.COMPUTE_PROVIDER,
      {
        providerId,
        date: snapshotDate.toISOString(),
        period,
      },
      {
        jobId: `metrics:provider:${providerId}:${period}:${snapshotDate.toISOString()}`,
      },
    );

    UtilFunctions.outputSuccess(
      res,
      result.queued
        ? result
        : await MetricsService.computeProviderSnapshot(providerId, snapshotDate, period),
      result.queued ? "Provider snapshot queued" : "Provider snapshot computed",
    );
  });

  // POST /metrics/compute/system — admin: trigger system snapshot
  static computeSystemSnapshot = catchAsync(async (req, res) => {
    const { date, period = "DAILY" } = req.body;
    const snapshotDate = date ? new Date(date) : new Date();
    const result = await enqueueJob(
      QUEUE_NAMES.METRICS,
      METRICS_JOB_NAMES.COMPUTE_SYSTEM,
      {
        date: snapshotDate.toISOString(),
        period,
      },
      {
        jobId: `metrics:system:${period}:${snapshotDate.toISOString()}`,
      },
    );

    UtilFunctions.outputSuccess(
      res,
      result.queued
        ? result
        : await MetricsService.computeSystemSnapshot(snapshotDate, period),
      result.queued ? "System snapshot queued" : "System snapshot computed",
    );
  });

  // POST /metrics/compute/all — admin: full batch compute
  static computeAll = catchAsync(async (req, res) => {
    const { date, period = "DAILY" } = req.body;
    const snapshotDate = date ? new Date(date) : new Date();

    const [providerResults, systemSnapshot] = await Promise.all([
      enqueueJob(
        QUEUE_NAMES.METRICS,
        METRICS_JOB_NAMES.COMPUTE_ALL_PROVIDERS,
        {
          date: snapshotDate.toISOString(),
          period,
        },
        {
          jobId: `metrics:all-providers:${period}:${snapshotDate.toISOString()}`,
        },
      ),
      enqueueJob(
        QUEUE_NAMES.METRICS,
        METRICS_JOB_NAMES.COMPUTE_SYSTEM,
        {
          date: snapshotDate.toISOString(),
          period,
        },
        {
          jobId: `metrics:system:${period}:${snapshotDate.toISOString()}`,
        },
      ),
    ]);

    if (providerResults.queued && systemSnapshot.queued) {
      return UtilFunctions.outputSuccess(
        res,
        { providerResults, systemSnapshot },
        "Batch computation queued",
      );
    }

    const [computedProviderResults, computedSystemSnapshot] = await Promise.all([
      MetricsService.computeAllProviderSnapshots(snapshotDate, period),
      MetricsService.computeSystemSnapshot(snapshotDate, period),
    ]);

    UtilFunctions.outputSuccess(
      res,
      {
        providerResults: computedProviderResults,
        systemSnapshot: computedSystemSnapshot,
      },
      "Batch computation complete"
    );
  });
}

export default MetricsController;
