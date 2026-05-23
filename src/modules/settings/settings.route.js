import express from "express";
import rateLimit from "express-rate-limit";
import { requireRbacRole } from "../../middlewares/auth.js";
import SettingsController from "./settings.controller.js";

const settingsRouter = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

settingsRouter.get(
  "/appointments",
  limiter,
  requireRbacRole(["ADMIN", "SERVICE_PROVIDER", "CAREGIVER"]),
  SettingsController.getAppointmentSettings
);

settingsRouter.put(
  "/appointments",
  limiter,
  requireRbacRole(["ADMIN", "SERVICE_PROVIDER", "CAREGIVER"]),
  SettingsController.updateAppointmentSettings
);

settingsRouter.get(
  "/telehealth",
  limiter,
  requireRbacRole(["ADMIN", "SERVICE_PROVIDER", "CAREGIVER"]),
  SettingsController.getTelehealthSettings
);

settingsRouter.put(
  "/telehealth",
  limiter,
  requireRbacRole(["ADMIN", "SERVICE_PROVIDER", "CAREGIVER"]),
  SettingsController.updateTelehealthSettings
);

export default settingsRouter;