import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import AdherenceService from "./adherence.service.js";

class AdherenceController {
  static getLogsForTask = catchAsync(async (req, res) => {
    const result = await AdherenceService.getLogsForTask(res.locals.user, req.params.taskId, req.query);
    UtilFunctions.outputSuccess(res, result, "Adherence logs retrieved successfully");
  });

  static markLogCompleted = catchAsync(async (req, res) => {
    const result = await AdherenceService.markLogCompleted(res.locals.user, req.params.taskId, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Adherence log marked as completed");
  });

  static updateLog = catchAsync(async (req, res) => {
    const result = await AdherenceService.updateLog(res.locals.user, req.params.taskId, req.params.logId, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Adherence log updated successfully");
  });

  static getPatientSummary = catchAsync(async (req, res) => {
    const result = await AdherenceService.getPatientSummary(res.locals.user, req.params.patientId, req.query);
    UtilFunctions.outputSuccess(res, result, "Adherence summary retrieved successfully");
  });

  static getCalendarView = catchAsync(async (req, res) => {
    const result = await AdherenceService.getCalendarView(res.locals.user, req.params.taskId);
    UtilFunctions.outputSuccess(res, result, "Adherence calendar retrieved successfully");
  });
}

export default AdherenceController;
