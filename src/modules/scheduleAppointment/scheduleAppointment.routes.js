import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import ScheduleAppointmentController from "./scheduleAppointment.controller.js";
import { scheduleAppointmentSchema } from "./scheduleAppointment.validator.js";

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

export default scheduleAppointmentRouter;
