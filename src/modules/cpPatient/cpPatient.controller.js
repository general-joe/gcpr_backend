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
    const patients = await CpPatientService.fetchPatients(userId);

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
