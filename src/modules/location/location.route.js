import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import LocationController from "./location.controller.js";

const locationRouter = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60 });

// GET /location/lookup?digitalAddress=GA-123-4567
// Looks up coordinates + address info from a Ghana Post GPS digital address
locationRouter.get(
  "/lookup",
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
  limiter,
  LocationController.lookupDigitalAddress
);

// GET /location/reverse?lat=5.6037&lng=-0.1870
// Reverse geocodes lat/lng to a human-readable address
locationRouter.get(
  "/reverse",
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
  limiter,
  LocationController.reverseGeocode
);

// GET /location/validate?digitalAddress=GA-123-4567
// Validates address format and returns region code without an API call
locationRouter.get(
  "/validate",
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
  limiter,
  LocationController.validateAddress
);

export default locationRouter;
