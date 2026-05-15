import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";

import AssessmentController from "./assessment.controller.js";
import {
  submitAssessmentSchema,
  createReferralSchema,
  updateReferralStatusSchema,
  createRehabTaskSchema
} from "./assessment.validator.js";

const assessmentRouter = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50
});


// Allow both SERVICE_PROVIDER and ADMIN userTypes
const allowedUserTypes = ["SERVICE_PROVIDER", "ADMIN"];

assessmentRouter.get(
  "/tools",
  authorize(allowedUserTypes),
  AssessmentController.getAvailableTools
);

assessmentRouter.get(
  "/tools/:toolCode/form",
  authorize(allowedUserTypes),
  AssessmentController.getAssessmentFormByToolCode
);

assessmentRouter.post(
  "/submit",
  authorize(allowedUserTypes),
  validate(submitAssessmentSchema),
  limiter,
  AssessmentController.submitAssessment
);

assessmentRouter.get(
  "/:assessmentId/report",
  authorize(allowedUserTypes),
  AssessmentController.getAssessmentReport
);

assessmentRouter.get(
  "/:assessmentId/referral-recommendations",
  authorize(allowedUserTypes),
  AssessmentController.getReferralRecommendations
);

assessmentRouter.get(
  "/patient/:patientId/reports",
  authorize(allowedUserTypes),
  AssessmentController.getAssessmentReportsByPatient
);

assessmentRouter.get(
  "/referrals/incoming",
  authorize(allowedUserTypes),
  AssessmentController.getIncomingReferrals
);

assessmentRouter.get(
  "/referrals/outgoing",
  authorize(allowedUserTypes),
  AssessmentController.getOutgoingReferrals
);

assessmentRouter.post(
  "/referrals",
  authorize(allowedUserTypes),
  validate(createReferralSchema),
  AssessmentController.createReferral
);

assessmentRouter.patch(
  "/referrals/:referralId/status",
  authorize(allowedUserTypes),
  validate(updateReferralStatusSchema),
  AssessmentController.updateReferralStatus
);

assessmentRouter.post(
  "/referrals/:referralId/tasks",
  authorize(allowedUserTypes),
  validate(createRehabTaskSchema),
  AssessmentController.createRehabTaskFromReferral
);

assessmentRouter.get(
  "/tasks/my",
  authorize(allowedUserTypes),
  AssessmentController.getMyAssignedTasks
);

export default assessmentRouter;
