import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import ScheduleAppointmentController from "./scheduleAppointment.controller.js";
import { scheduleAppointmentSchema } from "./scheduleAppointment.validator.js";
import {
  approveAppointmentSchema,
  rescheduleAppointmentSchema,
} from "./scheduleAppointment.validator.js";

const scheduleAppointmentRouter = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});

scheduleAppointmentRouter.get(
  "/available-providers",
  authorize(["CAREGIVER"]),
  authRateLimiter,
  ScheduleAppointmentController.getAvailableProviders,
);

scheduleAppointmentRouter.post(
  "/",
  authorize(["CAREGIVER"]),
  validate(scheduleAppointmentSchema),
  authRateLimiter,
  ScheduleAppointmentController.createAppointment,
);

scheduleAppointmentRouter.get(
  "/provider-availability",
  authorize(["CAREGIVER"]),
  authRateLimiter,
  ScheduleAppointmentController.getProviderAvailability,
);
scheduleAppointmentRouter.patch(
  "/approve",
  authorize(["SERVICE_PROVIDER"]),
  validate(approveAppointmentSchema),
  authRateLimiter,
  ScheduleAppointmentController.approveAppointment,
);

scheduleAppointmentRouter.patch(
  "/reschedule",
  authorize(["SERVICE_PROVIDER"]),
  validate(rescheduleAppointmentSchema),
  authRateLimiter,
  ScheduleAppointmentController.rescheduleAppointment,
);

scheduleAppointmentRouter.get(
  "/provider",
  authorize(["SERVICE_PROVIDER"]),
  authRateLimiter,
  ScheduleAppointmentController.providerAppointments,
);

scheduleAppointmentRouter.get(
  "/caregiver",
  authorize(["CAREGIVER"]),
  authRateLimiter,
  ScheduleAppointmentController.caregiverAppointments,
);

export default scheduleAppointmentRouter;
