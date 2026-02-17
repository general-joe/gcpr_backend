import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";

import AssessmentController from "./assessment.controller.js";
import {
  submitAssessmentSchema,
  updateReferralStatusSchema,
  createRehabTaskSchema
} from "./assessment.validator.js";

const assessmentRouter = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50
});

assessmentRouter.get(
  "/tools",
  authorize(["SERVICE_PROVIDER"]),
  AssessmentController.getAvailableTools
);

assessmentRouter.get(
  "/tools/:toolCode/form",
  authorize(["SERVICE_PROVIDER"]),
  AssessmentController.getAssessmentFormByToolCode
);

assessmentRouter.post(
  "/submit",
  authorize(["SERVICE_PROVIDER"]),
  validate(submitAssessmentSchema),
  limiter,
  AssessmentController.submitAssessment
);

assessmentRouter.get(
  "/:assessmentId/report",
  authorize(["SERVICE_PROVIDER"]),
  AssessmentController.getAssessmentReport
);

assessmentRouter.get(
  "/patient/:patientId/reports",
  authorize(["SERVICE_PROVIDER"]),
  AssessmentController.getAssessmentReportsByPatient
);

assessmentRouter.get(
  "/referrals/incoming",
  authorize(["SERVICE_PROVIDER"]),
  AssessmentController.getIncomingReferrals
);

assessmentRouter.get(
  "/referrals/outgoing",
  authorize(["SERVICE_PROVIDER"]),
  AssessmentController.getOutgoingReferrals
);

assessmentRouter.patch(
  "/referrals/:referralId/status",
  authorize(["SERVICE_PROVIDER"]),
  validate(updateReferralStatusSchema),
  AssessmentController.updateReferralStatus
);

assessmentRouter.post(
  "/referrals/:referralId/tasks",
  authorize(["SERVICE_PROVIDER"]),
  validate(createRehabTaskSchema),
  AssessmentController.createRehabTaskFromReferral
);

assessmentRouter.get(
  "/tasks/my",
  authorize(["SERVICE_PROVIDER"]),
  AssessmentController.getMyAssignedTasks
);

export default assessmentRouter;
