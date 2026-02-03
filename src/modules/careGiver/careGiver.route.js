import express from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middlewares/validation.js";
import { caregiverProfileSchema } from "./careGiver.validator.js";
import upload from "../../middlewares/upload.js";
import { authorize } from "../../middlewares/auth.js";
import CareGiverController from "./careGiver.controller.js";

const caregiverRouter = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});

caregiverRouter.post(
  "/complete-profile",
  authorize(["CAREGIVER"]),
  upload.fields([{ name: "verificationDocuments", maxCount: 5 }]),
  validate(caregiverProfileSchema),
  authRateLimiter,
  CareGiverController.completeProfile
);

export default caregiverRouter;
