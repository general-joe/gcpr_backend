import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";

import AssessmentController from "./assessment.controller.js";
import { submitAssessmentSchema } from "./assessment.validator.js";

const assessmentRouter = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50
});

assessmentRouter.post(
  "/submit",
  authorize(["SERVICE_PROVIDER"]),
  validate(submitAssessmentSchema),
  limiter,
  AssessmentController.submitAssessment
);

assessmentRouter.get(
  "/:assessmentId/report",
  authorize(["SERVICE_PROVIDER", "ADMIN"]),
  AssessmentController.getAssessmentReport
);

assessmentRouter.get(
  "/patient/:patientId/reports",
  authorize(["SERVICE_PROVIDER", "ADMIN"]),
  AssessmentController.getAssessmentReportsByPatient
);

export default assessmentRouter;
