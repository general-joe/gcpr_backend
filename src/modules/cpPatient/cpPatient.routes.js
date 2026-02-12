import express from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middlewares/validation.js";
import { cpPatientSchema } from "./cpPatient.validator.js";
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
  CpPatientController.createPatient
);

cpPatientRouter.get(
  "/",
  authorize(["CAREGIVER"]),
  authRateLimiter,
  CpPatientController.getPatients
);

export default cpPatientRouter;
