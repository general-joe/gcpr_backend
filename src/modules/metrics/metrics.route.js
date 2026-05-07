import express from "express";
import rateLimit from "express-rate-limit";
import { authorize, requireRbacRole } from "../../middlewares/auth.js";
import MetricsController from "./metrics.controller.js";

const metricsRouter = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

// GET /metrics/provider — authenticated provider's own metrics
metricsRouter.get(
  "/provider",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  MetricsController.getProviderMetrics
);

// GET /metrics/patient/:patientId — patient metrics (provider or caregiver)
metricsRouter.get(
  "/patient/:patientId",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  MetricsController.getPatientMetrics
);

// GET /metrics/system — system-wide dashboard (admin only)
metricsRouter.get(
  "/system",
  limiter,
  requireRbacRole(["ADMIN"]),
  MetricsController.getSystemMetrics
);

// POST /metrics/compute/provider — trigger on-demand snapshot (admin)
metricsRouter.post(
  "/compute/provider",
  limiter,
  requireRbacRole(["ADMIN"]),
  MetricsController.computeProviderSnapshot
);

// POST /metrics/compute/system — trigger system snapshot (admin)
metricsRouter.post(
  "/compute/system",
  limiter,
  requireRbacRole(["ADMIN"]),
  MetricsController.computeSystemSnapshot
);

// POST /metrics/compute/all — full batch computation (admin)
metricsRouter.post(
  "/compute/all",
  limiter,
  requireRbacRole(["ADMIN"]),
  MetricsController.computeAll
);

export default metricsRouter;
