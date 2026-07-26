import express from "express";
import rateLimit from "express-rate-limit";
import { authorize, requireRbacRole } from "../../middlewares/auth.js";
import RbacController from "./rbac.controller.js";

const rbacRouter = express.Router();
const rbacCheckRouter = express.Router();

const rbacLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests. Please try again later."
});

const rbacAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many requests. Please try again later."
});

// ─── Permission Check (any authenticated user) ────────────────────────────────
rbacCheckRouter.get(
  "/check",
  rbacLimiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  RbacController.checkPermission
);

// ─── Role Management ──────────────────────────────────────────────────────────
rbacRouter.get("/roles", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.listRoles);
rbacRouter.post("/roles", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.createRole);
rbacRouter.get("/roles/:roleId", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.getRole);
rbacRouter.patch("/roles/:roleId", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.updateRole);
rbacRouter.delete("/roles/:roleId", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.deleteRole);

// ─── Permission Management ────────────────────────────────────────────────────
rbacRouter.get("/permissions", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.listPermissions);
rbacRouter.post("/permissions", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.createPermission);
rbacRouter.patch("/permissions/:permissionId", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.updatePermission);
rbacRouter.delete("/permissions/:permissionId", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.deletePermission);

// ─── Role ↔ Permission Toggle ─────────────────────────────────────────────────
rbacRouter.post(
  "/roles/:roleId/permissions/:permissionId",
  rbacAdminLimiter,
  requireRbacRole(["ADMIN"]),
  RbacController.assignPermissionToRole
);
rbacRouter.delete(
  "/roles/:roleId/permissions/:permissionId",
  rbacAdminLimiter,
  requireRbacRole(["ADMIN"]),
  RbacController.removePermissionFromRole
);
rbacRouter.put(
  "/roles/:roleId/permissions",
  rbacAdminLimiter,
  requireRbacRole(["ADMIN"]),
  RbacController.setRolePermissions
);

// ─── User Role Assignment ─────────────────────────────────────────────────────
rbacRouter.get("/users/:userId/roles", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.getUserRoles);
rbacRouter.get("/users/roles", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.getUsersRoles);
rbacRouter.post("/users/:userId/roles", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.assignRoleToUser);
rbacRouter.delete("/users/:userId/roles/:roleId", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.revokeRoleFromUser);

// ─── User Permission Overrides ────────────────────────────────────────────────
rbacRouter.get("/users/:userId/permissions", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.getUserEffectivePermissions);
rbacRouter.post("/users/:userId/permissions", rbacAdminLimiter, requireRbacRole(["ADMIN"]), RbacController.grantUserPermission);
rbacRouter.delete(
  "/users/:userId/permissions/:permissionId",
  rbacAdminLimiter,
  requireRbacRole(["ADMIN"]),
  RbacController.removeUserPermission
);

export default rbacRouter;
export { rbacCheckRouter };
