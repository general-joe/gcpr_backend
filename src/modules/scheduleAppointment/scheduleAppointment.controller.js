import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import ScheduleAppointmentService from "./scheduleAppointment.service.js";
import { availableProvidersQuerySchema } from "./scheduleAppointment.validator.js";

class ScheduleAppointmentController {
  static getAvailableProviders = catchAsync(async (req, res) => {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userId = res.locals.user?.id;
    
    WRITE.debug("GET /available-providers started", {
      requestId,
      userId,
      query: req.query,
      timestamp: new Date().toISOString(),
    });

    const parsedQuery = availableProvidersQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      const errors = parsedQuery.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));

      WRITE.warn("Validation error: GET /available-providers", {
        requestId,
        userId,
        errors,
        timestamp: new Date().toISOString(),
      });

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

    WRITE.info("GET /available-providers completed successfully", {
      requestId,
      userId,
      providersCount: result?.length || 0,
      timestamp: new Date().toISOString(),
    });

    UtilFunctions.outputSuccess(
      res,
      result,
      "Available providers fetched successfully",
    );
  });

  static createAppointment = catchAsync(async (req, res) => {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userId = res.locals.user?.id;
    const payload = req.validatedData ?? req.body;

    WRITE.debug("POST /appointments started", {
      requestId,
      userId,
      patientId: payload?.patientId,
      providerId: payload?.providerId,
      timestamp: new Date().toISOString(),
    });

    const result = await ScheduleAppointmentService.createAppointment(
      userId,
      payload,
    );

    WRITE.info("POST /appointments completed successfully", {
      requestId,
      userId,
      appointmentId: result?.id,
      timestamp: new Date().toISOString(),
    });

    UtilFunctions.outputSuccess(
      res,
      result,
      "Appointment scheduled successfully",
    );
  });

  static getProviderAvailability = catchAsync(async (req, res) => {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userId = res.locals.user?.id;
    const { providerId, date } = req.query;

    WRITE.debug("GET /provider-availability started", {
      requestId,
      userId,
      providerId,
      date,
      timestamp: new Date().toISOString(),
    });

    const result = await ScheduleAppointmentService.getProviderAvailability(
      providerId,
      date,
    );

    WRITE.info("GET /provider-availability completed successfully", {
      requestId,
      userId,
      providerId,
      slotsCount: result?.length || 0,
      timestamp: new Date().toISOString(),
    });

    UtilFunctions.outputSuccess(
      res,
      result,
      "Provider availability fetched successfully",
    );
  });

  static approveAppointment = catchAsync(async (req, res) => {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userId = res.locals.user?.id;
    const { appointmentId } = req.validatedData;

    WRITE.debug("PATCH /approve started", {
      requestId,
      userId,
      appointmentId,
      timestamp: new Date().toISOString(),
    });

    const result = await ScheduleAppointmentService.approveAppointment(
      userId,
      appointmentId,
    );

    WRITE.info("PATCH /approve completed successfully", {
      requestId,
      userId,
      appointmentId,
      timestamp: new Date().toISOString(),
    });

    UtilFunctions.outputSuccess(
      res,
      result,
      "Appointment approved successfully",
    );
  });

  static rescheduleAppointment = catchAsync(async (req, res) => {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userId = res.locals.user?.id;
    const payload = req.validatedData;

    WRITE.debug("PATCH /reschedule started", {
      requestId,
      userId,
      appointmentId: payload?.appointmentId,
      newDate: payload?.date,
      newTime: payload?.time,
      timestamp: new Date().toISOString(),
    });

    const result = await ScheduleAppointmentService.rescheduleAppointment(
      userId,
      payload,
    );

    WRITE.info("PATCH /reschedule completed successfully", {
      requestId,
      userId,
      appointmentId: payload?.appointmentId,
      timestamp: new Date().toISOString(),
    });

    UtilFunctions.outputSuccess(
      res,
      result,
      "Appointment rescheduled successfully",
    );
  });

  static providerAppointments = catchAsync(async (req, res) => {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userId = res.locals.user?.id;
    const query = req.query;

    WRITE.debug("GET /provider started", {
      requestId,
      userId,
      query,
      timestamp: new Date().toISOString(),
    });

    const result = await ScheduleAppointmentService.providerAppointments(
      userId,
      query,
    );

    WRITE.info("GET /provider completed successfully", {
      requestId,
      userId,
      appointmentsCount: result?.length || 0,
      timestamp: new Date().toISOString(),
    });

    UtilFunctions.outputSuccess(
      res,
      result,
      "Provider appointments fetched successfully",
    );
  });

  static caregiverAppointments = catchAsync(async (req, res) => {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userId = res.locals.user?.id;
    const query = req.query;

    WRITE.debug("GET /caregiver started", {
      requestId,
      userId,
      query,
      timestamp: new Date().toISOString(),
    });

    const result = await ScheduleAppointmentService.caregiverAppointments(
      userId,
      query,
    );

    WRITE.info("GET /caregiver completed successfully", {
      requestId,
      userId,
      appointmentsCount: result?.length || 0,
      timestamp: new Date().toISOString(),
    });

    UtilFunctions.outputSuccess(
      res,
      result,
      "Caregiver appointments fetched successfully",
    );
  });
}

export default ScheduleAppointmentController;
