import express from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middlewares/validation.js";
import {
  caregiverTaskStepDoneSchema,
  cpPatientSchema,
} from "./cpPatient.validator.js";
import { authorize } from "../../middlewares/auth.js";
import CpPatientController from "./cpPatient.controller.js";

const cpPatientRouter = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});

cpPatientRouter.post(
  "/",
  authorize(["CAREGIVER"]),
  validate(cpPatientSchema),
  authRateLimiter,
  CpPatientController.createPatient,
);

cpPatientRouter.get(
  "/",
  authorize(["CAREGIVER"]),
  authRateLimiter,
  CpPatientController.getPatients,
);

cpPatientRouter.get(
  "/:patientId/assigned-tasks",
  authorize(["CAREGIVER"]),
  authRateLimiter,
  CpPatientController.getAssignedTasks,
);

cpPatientRouter.patch(
  "/:patientId/assigned-tasks/:taskId/steps/done",
  authorize(["CAREGIVER"]),
  validate(caregiverTaskStepDoneSchema),
  authRateLimiter,
  CpPatientController.markTaskStepDone,
);

cpPatientRouter.patch(
  "/:patientId/assigned-tasks/:taskId/done",
  authorize(["CAREGIVER"]),
  authRateLimiter,
  CpPatientController.markTaskDone,
);

export default cpPatientRouter;
