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

  static getProviderAvailability = catchAsync(async (req, res) => {
    const { providerId, date } = req.query;

    const result = await ScheduleAppointmentService.getProviderAvailability(
      providerId,
      date,
    );

    UtilFunctions.outputSuccess(
      res,
      result,
      "Provider availability fetched successfully",
    );
  });
  static approveAppointment = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;
    const { appointmentId } = req.validatedData;

    const result = await ScheduleAppointmentService.approveAppointment(
      userId,
      appointmentId,
    );

    UtilFunctions.outputSuccess(
      res,
      result,
      "Appointment approved successfully",
    );
  });

  static rescheduleAppointment = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;
    const payload = req.validatedData;

    const result = await ScheduleAppointmentService.rescheduleAppointment(
      userId,
      payload,
    );

    UtilFunctions.outputSuccess(
      res,
      result,
      "Appointment rescheduled successfully",
    );
  });

  static providerAppointments = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;
    const query = req.query;

    const result = await ScheduleAppointmentService.providerAppointments(
      userId,
      query,
    );

    UtilFunctions.outputSuccess(
      res,
      result,
      "Provider appointments fetched successfully",
    );
  });

  static caregiverAppointments = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;
    const query = req.query;

    const result = await ScheduleAppointmentService.caregiverAppointments(
      userId,
      query,
    );

    UtilFunctions.outputSuccess(
      res,
      result,
      "Caregiver appointments fetched successfully",
    );
  });
}

export default ScheduleAppointmentController;
