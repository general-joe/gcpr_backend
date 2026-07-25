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
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  validate(createFunctionalClassificationSchema),
  FunctionalClassificationController.create
);

// GET /functional-classification/patient/:patientId — list all for a patient
fcRouter.get(
  "/patient/:patientId",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  FunctionalClassificationController.getByPatient
);

// GET /functional-classification/patient/:patientId/summary — progress summary
fcRouter.get(
  "/patient/:patientId/summary",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  FunctionalClassificationController.getProgressSummary
);

// GET /functional-classification/:id — single record
fcRouter.get(
  "/:id",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  FunctionalClassificationController.getOne
);

// PATCH /functional-classification/:id — update a record
fcRouter.patch(
  "/:id",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  validate(updateFunctionalClassificationSchema),
  FunctionalClassificationController.update
);

// DELETE /functional-classification/:id — delete a record
fcRouter.delete(
  "/:id",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  FunctionalClassificationController.delete
);

export default fcRouter;
