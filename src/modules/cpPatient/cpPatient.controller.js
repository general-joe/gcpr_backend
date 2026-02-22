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

  static markTaskStepDone = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;
    const { patientId, taskId } = req.params;
    const { stepIndex } = req.validatedData ?? req.body;
    const task = await CpPatientService.markTaskStepDone(
      userId,
      patientId,
      taskId,
      stepIndex,
    );

    UtilFunctions.outputSuccess(
      res,
      task,
      "Task step marked as done successfully",
    );
  });

  static markTaskDone = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;
    const { patientId, taskId } = req.params;
    const task = await CpPatientService.markTaskDone(userId, patientId, taskId);

    UtilFunctions.outputSuccess(
      res,
      task,
      "Task marked as completed successfully",
    );
  });
}

export default CpPatientController;
