import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import ScheduleAppointmentService from "./scheduleAppointment.service.js";
import { availableProvidersQuerySchema } from "./scheduleAppointment.validator.js";

class ScheduleAppointmentController {
  static getAvailableProviders = catchAsync(async (req, res) => {
    const parsedQuery = availableProvidersQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      const errors = parsedQuery.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const { date, time } = parsedQuery.data;
    const result = await ScheduleAppointmentService.getAvailableProviders(
      date,
      time,
    );

    UtilFunctions.outputSuccess(
      res,
      result,
      "Available providers fetched successfully",
    );
  });

  static createAppointment = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;
    const payload = req.validatedData ?? req.body;
    const result = await ScheduleAppointmentService.createAppointment(
      userId,
      payload,
    );

    UtilFunctions.outputSuccess(
      res,
      result,
      "Appointment scheduled successfully",
    );
  });
}

export default ScheduleAppointmentController;
