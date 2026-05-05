import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import RbacService from "./rbac.service.js";

export default class RbacController {
  // Roles
  static listRoles = catchAsync(async (req, res) => {
    const result = await RbacService.listRoles();
    UtilFunctions.outputSuccess(res, result, "Roles retrieved successfully");
  });

  static createRole = catchAsync(async (req, res) => {
    const result = await RbacService.createRole(req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Role created successfully");
  });

  static getRole = catchAsync(async (req, res) => {
    const result = await RbacService.getRole(req.params.roleId);
    UtilFunctions.outputSuccess(res, result, "Role retrieved successfully");
  });

  static updateRole = catchAsync(async (req, res) => {
    const result = await RbacService.updateRole(req.params.roleId, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Role updated successfully");
  });

  static deleteRole = catchAsync(async (req, res) => {
    await RbacService.deleteRole(req.params.roleId);
    UtilFunctions.outputSuccess(res, {}, "Role deleted successfully");
  });

  // Permissions
  static listPermissions = catchAsync(async (req, res) => {
    const result = await RbacService.listPermissions();
    UtilFunctions.outputSuccess(res, result, "Permissions retrieved successfully");
  });

  static createPermission = catchAsync(async (req, res) => {
    const result = await RbacService.createPermission(req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Permission created successfully");
  });

  static updatePermission = catchAsync(async (req, res) => {
    const result = await RbacService.updatePermission(req.params.permissionId, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Permission updated successfully");
  });

  static deletePermission = catchAsync(async (req, res) => {
    await RbacService.deletePermission(req.params.permissionId);
    UtilFunctions.outputSuccess(res, {}, "Permission deleted successfully");
  });

  // Role ↔ Permission
  static assignPermissionToRole = catchAsync(async (req, res) => {
    const result = await RbacService.assignPermissionToRole(req.params.roleId, req.params.permissionId);
    UtilFunctions.outputSuccess(res, result, "Permission assigned to role");
  });

  static removePermissionFromRole = catchAsync(async (req, res) => {
    const result = await RbacService.removePermissionFromRole(req.params.roleId, req.params.permissionId);
    UtilFunctions.outputSuccess(res, result, "Permission removed from role");
  });

  static setRolePermissions = catchAsync(async (req, res) => {
    const result = await RbacService.setRolePermissions(req.params.roleId, (req.validatedData ?? req.body).permissionIds);
    UtilFunctions.outputSuccess(res, result, "Role permissions updated successfully");
  });

  // User Roles
  static getUserRoles = catchAsync(async (req, res) => {
    const result = await RbacService.getUserRoles(req.params.userId);
    UtilFunctions.outputSuccess(res, result, "User roles retrieved successfully");
  });

  static assignRoleToUser = catchAsync(async (req, res) => {
    const result = await RbacService.assignRoleToUser(req.params.userId, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Role assigned to user");
  });

  static revokeRoleFromUser = catchAsync(async (req, res) => {
    const result = await RbacService.revokeRoleFromUser(req.params.userId, req.params.roleId);
    UtilFunctions.outputSuccess(res, result, "Role revoked from user");
  });

  // User Permissions
  static getUserEffectivePermissions = catchAsync(async (req, res) => {
    const result = await RbacService.getUserEffectivePermissions(req.params.userId);
    UtilFunctions.outputSuccess(res, result, "User permissions retrieved successfully");
  });

  static grantUserPermission = catchAsync(async (req, res) => {
    const result = await RbacService.grantUserPermission(req.params.userId, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Permission granted/denied for user");
  });

  static removeUserPermission = catchAsync(async (req, res) => {
    const result = await RbacService.removeUserPermission(req.params.userId, req.params.permissionId);
    UtilFunctions.outputSuccess(res, result, "User permission override removed");
  });

  // Permission Check
  static checkPermission = catchAsync(async (req, res) => {
    const { permission } = req.query;
    if (!permission) {
      return UtilFunctions.outputError(res, "permission query param is required", {}, "VALIDATION_ERROR", 400);
    }
    const result = await RbacService.checkPermission(res.locals.user.id, permission);
    UtilFunctions.outputSuccess(res, result, "Permission check completed");
  });
}
