import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import CpPatientService from "./cpPatient.service.js";

class CpPatientController {
  static createPatient = catchAsync(async (req, res) => {
    const data = req.body;
    const userId = res.locals.user?.id;
    const result = await CpPatientService.createPatient(data, userId);
    UtilFunctions.outputSuccess(res, result, "CP patient created successfully");
  });

  static getPatients = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const patients = await CpPatientService.fetchPatients(userId, page, limit);

    UtilFunctions.outputSuccess(res, patients, "Patients fetched successfully");
  });

  static getAssignedTasks = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;
    const { patientId } = req.params;
    const tasks = await CpPatientService.getAssignedTasks(userId, patientId);

    UtilFunctions.outputSuccess(
      res,
      tasks,
      "Assigned tasks retrieved successfully",
    );
  });

  static getPatientTimeline = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const { patientId } = req.params;
    const timeline = await CpPatientService.getPatientTimeline(user, patientId);

    UtilFunctions.outputSuccess(res, timeline, "Patient timeline retrieved successfully");
  });

  static markTaskDayDone = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;
    const { patientId, taskId } = req.params;
    const { date } = req.validatedData ?? req.body;
    const task = await CpPatientService.markTaskDayDone(
      userId,
      patientId,
      taskId,
      date,
    );

    UtilFunctions.outputSuccess(
      res,
      task,
      "Task day marked as done successfully",
    );
  });
}

export default CpPatientController;
