import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import MetricsService from "./metrics.service.js";

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
    const result = await MetricsService.computeProviderSnapshot(
      providerId,
      snapshotDate,
      period
    );
    UtilFunctions.outputSuccess(res, result, "Provider snapshot computed");
  });

  // POST /metrics/compute/system — admin: trigger system snapshot
  static computeSystemSnapshot = catchAsync(async (req, res) => {
    const { date, period = "DAILY" } = req.body;
    const snapshotDate = date ? new Date(date) : new Date();
    const result = await MetricsService.computeSystemSnapshot(
      snapshotDate,
      period
    );
    UtilFunctions.outputSuccess(res, result, "System snapshot computed");
  });

  // POST /metrics/compute/all — admin: full batch compute
  static computeAll = catchAsync(async (req, res) => {
    const { date, period = "DAILY" } = req.body;
    const snapshotDate = date ? new Date(date) : new Date();

    const [providerResults, systemSnapshot] = await Promise.all([
      MetricsService.computeAllProviderSnapshots(snapshotDate, period),
      MetricsService.computeSystemSnapshot(snapshotDate, period),
    ]);

    UtilFunctions.outputSuccess(
      res,
      { providerResults, systemSnapshot },
      "Batch computation complete"
    );
  });
}

export default MetricsController;
