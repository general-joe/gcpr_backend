import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import AdherenceController from "./adherence.controller.js";
import { markLogCompletedSchema, updateLogSchema } from "./adherence.validator.js";

const adherenceRouter = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

adherenceRouter.get(
  "/tasks/:taskId/logs",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  AdherenceController.getLogsForTask
);

adherenceRouter.post(
  "/tasks/:taskId/logs",
  limiter,
  authorize(["CAREGIVER"]),
  validate(markLogCompletedSchema),
  AdherenceController.markLogCompleted
);

adherenceRouter.patch(
  "/tasks/:taskId/logs/:logId",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  validate(updateLogSchema),
  AdherenceController.updateLog
);

adherenceRouter.get(
  "/patients/:patientId/summary",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  AdherenceController.getPatientSummary
);

adherenceRouter.get(
  "/tasks/:taskId/calendar",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  AdherenceController.getCalendarView
);

export default adherenceRouter;
