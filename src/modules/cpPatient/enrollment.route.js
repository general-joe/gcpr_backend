import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import EnrollmentService from "./enrollment.service.js";
import { z } from "zod";

const enrollmentRouter = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

const enrollPatientSchema = z.object({
  patientId: z.string().uuid(),
  programName: z.string().max(200).optional(),
  notes: z.string().max(1000).optional()
});

const updateEnrollmentSchema = z.object({
  status: z.enum(["SUSPENDED", "COMPLETED", "WITHDRAWN"]),
  unenrollReason: z.string().max(500).optional()
});

enrollmentRouter.post(
  "/",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  validate(enrollPatientSchema),
  catchAsync(async (req, res) => {
    const result = await EnrollmentService.enrollPatient(res.locals.user, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Patient enrolled successfully");
  })
);

enrollmentRouter.get(
  "/patient/:patientId",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  catchAsync(async (req, res) => {
    const result = await EnrollmentService.getEnrollmentByPatient(res.locals.user, req.params.patientId);
    UtilFunctions.outputSuccess(res, result, "Enrollment record retrieved successfully");
  })
);

enrollmentRouter.patch(
  "/:id",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  validate(updateEnrollmentSchema),
  catchAsync(async (req, res) => {
    const result = await EnrollmentService.updateEnrollment(res.locals.user, req.params.id, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Enrollment updated successfully");
  })
);

enrollmentRouter.get(
  "/stats",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  catchAsync(async (req, res) => {
    const result = await EnrollmentService.getEnrollmentStats(res.locals.user);
    UtilFunctions.outputSuccess(res, result, "Enrollment statistics retrieved successfully");
  })
);

export default enrollmentRouter;
