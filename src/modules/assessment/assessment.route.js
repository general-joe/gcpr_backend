import express from "express";
import rateLimit from "express-rate-limit";
import { authorize, authorizeOrRbacRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";

import AssessmentController from "./assessment.controller.js";
import {
  submitAssessmentSchema,
  createReferralSchema,
  updateReferralStatusSchema,
  createRehabTaskSchema,
} from "./assessment.validator.js";

const assessmentRouter = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});

// Allow both SERVICE_PROVIDER and ADMIN userTypes or RBAC roles ADMIN/TESTER
const allowedUserTypes = ["SERVICE_PROVIDER", "ADMIN"];
const assessmentAuth = authorizeOrRbacRole(allowedUserTypes, [
  "ADMIN",
  "TESTER",
]);

assessmentRouter.get(
  "/tools",
  assessmentAuth,
  AssessmentController.getAvailableTools,
);

assessmentRouter.get(
  "/tools/:toolCode/form",
  assessmentAuth,
  AssessmentController.getAssessmentFormByToolCode,
);

assessmentRouter.post(
  "/submit",
  assessmentAuth,
  validate(submitAssessmentSchema),
  limiter,
  AssessmentController.submitAssessment,
);

assessmentRouter.get(
  "/:assessmentId/report",
  assessmentAuth,
  AssessmentController.getAssessmentReport,
);

assessmentRouter.get(
  "/:assessmentId/referral-recommendations",
  assessmentAuth,
  AssessmentController.getReferralRecommendations,
);

assessmentRouter.get(
  "/patient/:patientId/reports",
  assessmentAuth,
  AssessmentController.getAssessmentReportsByPatient,
);

assessmentRouter.get(
  "/referrals/incoming",
  assessmentAuth,
  AssessmentController.getIncomingReferrals,
);

assessmentRouter.get(
  "/referrals/outgoing",
  assessmentAuth,
  AssessmentController.getOutgoingReferrals,
);

assessmentRouter.post(
  "/referrals",
  assessmentAuth,
  validate(createReferralSchema),
  AssessmentController.createReferral,
);

assessmentRouter.patch(
  "/referrals/:referralId/status",
  assessmentAuth,
  validate(updateReferralStatusSchema),
  AssessmentController.updateReferralStatus,
);

assessmentRouter.post(
  "/referrals/:referralId/tasks",
  assessmentAuth,
  validate(createRehabTaskSchema),
  AssessmentController.createRehabTaskFromReferral,
);

assessmentRouter.get(
  "/tasks/my",
  assessmentAuth,
  AssessmentController.getMyAssignedTasks,
);

assessmentRouter.get(
  "/tasks/:taskId",
  assessmentAuth,
  AssessmentController.getRehabTask,
);

export default assessmentRouter;
