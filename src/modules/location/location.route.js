import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import LocationController from "./location.controller.js";

const locationRouter = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60 });

// GET /location/lookup?digitalAddress=GA-123-4567
locationRouter.get(
  "/lookup",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
  LocationController.lookupDigitalAddress
);

// GET /location/reverse?lat=5.6037&lng=-0.1870
locationRouter.get(
  "/reverse",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
  LocationController.reverseGeocode
);

// GET /location/validate?digitalAddress=GA-123-4567
locationRouter.get(
  "/validate",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
  LocationController.validateAddress
);

export default locationRouter;
