import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import RbacController from "./rbac.controller.js";

const rbacRouter = express.Router();
const rbacCheckRouter = express.Router();

const rbacLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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
rbacRouter.get("/roles", authorize(["ADMIN"]), RbacController.listRoles);
rbacRouter.post("/roles", authorize(["ADMIN"]), RbacController.createRole);
rbacRouter.get("/roles/:roleId", authorize(["ADMIN"]), RbacController.getRole);
rbacRouter.patch("/roles/:roleId", authorize(["ADMIN"]), RbacController.updateRole);
rbacRouter.delete("/roles/:roleId", authorize(["ADMIN"]), RbacController.deleteRole);

// ─── Permission Management ────────────────────────────────────────────────────
rbacRouter.get("/permissions", authorize(["ADMIN"]), RbacController.listPermissions);
rbacRouter.post("/permissions", authorize(["ADMIN"]), RbacController.createPermission);
rbacRouter.patch("/permissions/:permissionId", authorize(["ADMIN"]), RbacController.updatePermission);
rbacRouter.delete("/permissions/:permissionId", authorize(["ADMIN"]), RbacController.deletePermission);

// ─── Role ↔ Permission Toggle ─────────────────────────────────────────────────
rbacRouter.post(
  "/roles/:roleId/permissions/:permissionId",
  authorize(["ADMIN"]),
  RbacController.assignPermissionToRole
);
rbacRouter.delete(
  "/roles/:roleId/permissions/:permissionId",
  authorize(["ADMIN"]),
  RbacController.removePermissionFromRole
);
rbacRouter.put(
  "/roles/:roleId/permissions",
  authorize(["ADMIN"]),
  RbacController.setRolePermissions
);

// ─── User Role Assignment ─────────────────────────────────────────────────────
rbacRouter.get("/users/:userId/roles", authorize(["ADMIN"]), RbacController.getUserRoles);
rbacRouter.post("/users/:userId/roles", authorize(["ADMIN"]), RbacController.assignRoleToUser);
rbacRouter.delete("/users/:userId/roles/:roleId", authorize(["ADMIN"]), RbacController.revokeRoleFromUser);

// ─── User Permission Overrides ────────────────────────────────────────────────
rbacRouter.get("/users/:userId/permissions", authorize(["ADMIN"]), RbacController.getUserEffectivePermissions);
rbacRouter.post("/users/:userId/permissions", authorize(["ADMIN"]), RbacController.grantUserPermission);
rbacRouter.delete(
  "/users/:userId/permissions/:permissionId",
  authorize(["ADMIN"]),
  RbacController.removeUserPermission
);

export default rbacRouter;
export { rbacCheckRouter };
