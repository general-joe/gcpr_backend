import express from "express";
import rateLimit from "express-rate-limit";
import { requireRbacRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import AdminController from "./admin.controller.js";
import { z } from "zod";

const adminRouter = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const bootstrapLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DEACTIVATED", "DELETED"]),
});

const verifyProviderSchema = z.object({
  licenseStatus: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
});

const providerVerificationSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES", "SUSPEND"]),
  verificationNote: z.string().optional(),
  licenseStatus: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
});

// NOTE (Group 5): legacy tool schemas removed with the
// dead AssessmentTool tables. Tool authoring lives in
// modules/assessment/definitions (mounted at /admin/assessment-tools).

// ── Bootstrap ─────────────────────────────────────────────────────────────────
// Seed default RBAC roles and permissions. Protected by BOOTSTRAP_SECRET env var.
// POST /admin/bootstrap   { secret: "<BOOTSTRAP_SECRET>", userId: "<uuid>" }
// userId is optional — if provided, the ADMIN role is assigned to that user.
adminRouter.post("/bootstrap", bootstrapLimiter, AdminController.bootstrap);

// ── Seed RBAC (ADMIN only) ───────────────────────────────────────────────────
// Re-seeds default roles / permissions (idempotent upsert).
adminRouter.post(
  "/rbac/seed",
  limiter,
  requireRbacRole(["ADMIN"]),
  AdminController.seedRbac,
);

// User Management
adminRouter.get(
  "/users",
  limiter,
  requireRbacRole(["ADMIN"]),
  AdminController.listUsers,
);
adminRouter.get(
  "/users/:id",
  limiter,
  requireRbacRole(["ADMIN"]),
  AdminController.getUserById,
);
adminRouter.patch(
  "/users/:id/status",
  limiter,
  requireRbacRole(["ADMIN"]),
  validate(updateUserStatusSchema),
  AdminController.updateUserStatus,
);
adminRouter.delete(
  "/users/:id",
  limiter,
  requireRbacRole(["ADMIN", "SUPPORT"]),
  AdminController.deleteUser,
);

// Service Provider Management
adminRouter.get(
  "/providers",
  limiter,
  requireRbacRole(["ADMIN"]),
  AdminController.listProviders,
);
adminRouter.patch(
  "/providers/:id/verify",
  limiter,
  requireRbacRole(["ADMIN"]),
  validate(verifyProviderSchema),
  AdminController.verifyProvider,
);
adminRouter.patch(
  "/providers/:id/verification",
  limiter,
  requireRbacRole(["ADMIN"]),
  validate(providerVerificationSchema),
  AdminController.updateProviderVerification,
);
adminRouter.get(
  "/providers/:id",
  limiter,
  requireRbacRole(["ADMIN"]),
  AdminController.getProviderById,
);

// Patient Management
adminRouter.get(
  "/patients",
  limiter,
  requireRbacRole(["ADMIN"]),
  AdminController.listPatients,
);
adminRouter.get(
  "/patients/:id",
  limiter,
  requireRbacRole(["ADMIN"]),
  AdminController.getPatientById,
);

// System Metrics
adminRouter.get(
  "/metrics/system",
  limiter,
  requireRbacRole(["ADMIN"]),
  AdminController.getSystemMetrics,
);
adminRouter.get(
  "/metrics/providers",
  limiter,
  requireRbacRole(["ADMIN"]),
  AdminController.getProviderMetricsComparison,
);

// Community Moderation
adminRouter.get(
  "/communities",
  limiter,
  requireRbacRole(["ADMIN"]),
  AdminController.listCommunities,
);
adminRouter.delete(
  "/communities/:id",
  limiter,
  requireRbacRole(["ADMIN"]),
  AdminController.deleteCommunity,
);
adminRouter.delete(
  "/communities/:communityId/members/:userId",
  limiter,
  requireRbacRole(["ADMIN"]),
  AdminController.removeCommunityMember,
);

// Assessment tool authoring moved to modules/assessment/definitions
// (mounted at /admin/assessment-tools). See toolDefinition.route.js.

export default adminRouter;
