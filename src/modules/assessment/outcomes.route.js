import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import OutcomesService from "./outcomes.service.js";
import { z } from "zod";

const outcomesRouter = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

const createOutcomeSchema = z.object({
  patientId: z.string().uuid(),
  baselineLevel: z.number().int().min(1).max(5),
  currentLevel: z.number().int().min(1).max(5),
  baselineDate: z.coerce.date(),
  reviewDate: z.coerce.date(),
  assessmentToolUsed: z.string().max(100).optional(),
  notes: z.string().max(2000).optional()
});

const updateOutcomeSchema = z.object({
  notes: z.string().max(2000).optional(),
  assessmentToolUsed: z.string().max(100).optional()
});

outcomesRouter.get(
  "/patient/:patientId",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  catchAsync(async (req, res) => {
    const result = await OutcomesService.listPatientOutcomes(res.locals.user, req.params.patientId, req.query);
    UtilFunctions.outputSuccess(res, result, "Motor function outcomes retrieved successfully");
  })
);

outcomesRouter.get(
  "/patient/:patientId/latest",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  catchAsync(async (req, res) => {
    const result = await OutcomesService.getLatestOutcome(res.locals.user, req.params.patientId);
    UtilFunctions.outputSuccess(res, result, "Latest outcome retrieved successfully");
  })
);

outcomesRouter.get(
  "/provider/summary",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  catchAsync(async (req, res) => {
    const result = await OutcomesService.getProviderSummary(res.locals.user);
    UtilFunctions.outputSuccess(res, result, "Provider outcome summary retrieved successfully");
  })
);

outcomesRouter.get(
  "/:id",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  catchAsync(async (req, res) => {
    const result = await OutcomesService.getOutcomeById(res.locals.user, req.params.id);
    UtilFunctions.outputSuccess(res, result, "Outcome record retrieved successfully");
  })
);

outcomesRouter.post(
  "/",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  validate(createOutcomeSchema),
  catchAsync(async (req, res) => {
    const result = await OutcomesService.createOutcome(res.locals.user, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Outcome record created successfully");
  })
);

outcomesRouter.patch(
  "/:id",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  validate(updateOutcomeSchema),
  catchAsync(async (req, res) => {
    const result = await OutcomesService.updateOutcome(res.locals.user, req.params.id, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Outcome record updated successfully");
  })
);

outcomesRouter.delete(
  "/:id",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  catchAsync(async (req, res) => {
    await OutcomesService.deleteOutcome(res.locals.user, req.params.id);
    UtilFunctions.outputSuccess(res, {}, "Outcome record deleted successfully");
  })
);

export default outcomesRouter;
