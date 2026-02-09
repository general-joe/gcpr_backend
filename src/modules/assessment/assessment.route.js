import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";

import AssessmentController from "./assessment.controller.js";
// import { submitAssessmentSchema } from "./assessment.validator.js";

const assessmentRouter = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50
});

assessmentRouter.post(
  "/submit",
  authorize(["SERVICE_PROVIDER"]),
  limiter,
  AssessmentController.submitAssessment
);

export default assessmentRouter;
