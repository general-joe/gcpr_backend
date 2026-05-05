import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import AdminController from "./admin.controller.js";
import { z } from "zod";

const adminRouter = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DEACTIVATED", "DELETED"])
});

const verifyProviderSchema = z.object({
  licenseStatus: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE")
});

const createToolSchema = z.object({
  toolCode: z.string().min(2).max(100),
  toolName: z.string().min(2).max(200),
  version: z.string().optional().default("1.0"),
  description: z.string().optional(),
  schema: z.record(z.string(), z.any()).optional(),
  professions: z.array(z.string()).optional().default([])
});

const updateToolSchema = z.object({
  isActive: z.boolean().optional(),
  description: z.string().optional(),
  schema: z.record(z.string(), z.any()).optional()
});

// User Management
adminRouter.get("/users", limiter, authorize(["ADMIN"]), AdminController.listUsers);
adminRouter.get("/users/:id", limiter, authorize(["ADMIN"]), AdminController.getUserById);
adminRouter.patch("/users/:id/status", limiter, authorize(["ADMIN"]), validate(updateUserStatusSchema), AdminController.updateUserStatus);
adminRouter.delete("/users/:id", limiter, authorize(["ADMIN"]), AdminController.deleteUser);

// Service Provider Management
adminRouter.get("/providers", limiter, authorize(["ADMIN"]), AdminController.listProviders);
adminRouter.patch("/providers/:id/verify", limiter, authorize(["ADMIN"]), validate(verifyProviderSchema), AdminController.verifyProvider);
adminRouter.get("/providers/:id", limiter, authorize(["ADMIN"]), AdminController.getProviderById);

// Patient Management
adminRouter.get("/patients", limiter, authorize(["ADMIN"]), AdminController.listPatients);
adminRouter.get("/patients/:id", limiter, authorize(["ADMIN"]), AdminController.getPatientById);

// System Metrics
adminRouter.get("/metrics/system", limiter, authorize(["ADMIN"]), AdminController.getSystemMetrics);
adminRouter.get("/metrics/providers", limiter, authorize(["ADMIN"]), AdminController.getProviderMetricsComparison);

// Community Moderation
adminRouter.get("/communities", limiter, authorize(["ADMIN"]), AdminController.listCommunities);
adminRouter.delete("/communities/:id", limiter, authorize(["ADMIN"]), AdminController.deleteCommunity);
adminRouter.delete("/communities/:communityId/members/:userId", limiter, authorize(["ADMIN"]), AdminController.removeCommunityMember);

// Assessment Tools
adminRouter.get("/assessment-tools", limiter, authorize(["ADMIN"]), AdminController.listAssessmentTools);
adminRouter.post("/assessment-tools", limiter, authorize(["ADMIN"]), validate(createToolSchema), AdminController.createAssessmentTool);
adminRouter.patch("/assessment-tools/:id", limiter, authorize(["ADMIN"]), validate(updateToolSchema), AdminController.updateAssessmentTool);

export default adminRouter;
