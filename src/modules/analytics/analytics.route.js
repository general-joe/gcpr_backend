import express from "express";
import rateLimit from "express-rate-limit";
import { authorize, requireRbacRole } from "../../middlewares/auth.js";
import AnalyticsController from "./analytics.controller.js";

const analyticsRouter = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

// GET /analytics/admin?filter=today|this_week|this_month|all_time
analyticsRouter.get(
  "/admin",
  limiter,
  requireRbacRole(["ADMIN", "SUPPORT"]),
  AnalyticsController.getAdminDashboard
);

// GET /analytics/provider?filter=today|this_week|this_month|all_time
analyticsRouter.get(
  "/provider",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  AnalyticsController.getProviderDashboard
);

// GET /analytics/support?filter=today|this_week|this_month|all_time
analyticsRouter.get(
  "/support",
  limiter,
  requireRbacRole(["ADMIN"]),
  AnalyticsController.getSupportDashboard
);

export default analyticsRouter;
