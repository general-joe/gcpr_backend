import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import {
  createFunctionalClassificationSchema,
  updateFunctionalClassificationSchema,
} from "./functionalClassification.validator.js";
import FunctionalClassificationController from "./functionalClassification.controller.js";

const fcRouter = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60 });

// POST /functional-classification — record a new classification
fcRouter.post(
  "/",
  authorize(["SERVICE_PROVIDER"]),
  validate(createFunctionalClassificationSchema),
  limiter,
  FunctionalClassificationController.create
);

// GET /functional-classification/patient/:patientId — list all for a patient
fcRouter.get(
  "/patient/:patientId",
  authorize(["SERVICE_PROVIDER"]),
  limiter,
  FunctionalClassificationController.getByPatient
);

// GET /functional-classification/patient/:patientId/summary — progress summary
fcRouter.get(
  "/patient/:patientId/summary",
  authorize(["SERVICE_PROVIDER"]),
  limiter,
  FunctionalClassificationController.getProgressSummary
);

// GET /functional-classification/:id — single record
fcRouter.get(
  "/:id",
  authorize(["SERVICE_PROVIDER"]),
  limiter,
  FunctionalClassificationController.getOne
);

// PATCH /functional-classification/:id — update a record
fcRouter.patch(
  "/:id",
  authorize(["SERVICE_PROVIDER"]),
  validate(updateFunctionalClassificationSchema),
  limiter,
  FunctionalClassificationController.update
);

// DELETE /functional-classification/:id — delete a record
fcRouter.delete(
  "/:id",
  authorize(["SERVICE_PROVIDER"]),
  limiter,
  FunctionalClassificationController.delete
);

export default fcRouter;
