import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import AdminService from "./admin.service.js";

class AdminController {
  // Bootstrap — seed RBAC and optionally assign ADMIN role to a first user
  static bootstrap = catchAsync(async (req, res) => {
    const result = await AdminService.bootstrap(req.body);
    UtilFunctions.outputSuccess(res, result, "Bootstrap completed");
  });

  // Seed default RBAC roles / permissions (idempotent)
  static seedRbac = catchAsync(async (req, res) => {
    const result = await AdminService.seedRbac();
    UtilFunctions.outputSuccess(res, result, "RBAC seeded successfully");
  });
  
  // User Management
  static listUsers = catchAsync(async (req, res) => {
    const result = await AdminService.listUsers(req.query);
    UtilFunctions.outputSuccess(res, result, "Users retrieved successfully");
  });

  static getUserById = catchAsync(async (req, res) => {
    const result = await AdminService.getUserById(req.params.id);
    UtilFunctions.outputSuccess(res, result, "User retrieved successfully");
  });

  static updateUserStatus = catchAsync(async (req, res) => {
    const { status } = req.validatedData ?? req.body;
    const result = await AdminService.updateUserStatus(req.params.id, status);
    UtilFunctions.outputSuccess(res, result, "User status updated successfully");
  });

  static deleteUser = catchAsync(async (req, res) => {
    await AdminService.deleteUser(req.params.id);
    UtilFunctions.outputSuccess(res, {}, "User deleted successfully");
  });

  // Provider Management
  static listProviders = catchAsync(async (req, res) => {
    const result = await AdminService.listProviders(req.query);
    UtilFunctions.outputSuccess(res, result, "Service providers retrieved successfully");
  });

  static verifyProvider = catchAsync(async (req, res) => {
    const result = await AdminService.verifyProvider(req.params.id, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Provider verified successfully");
  });

  static getProviderById = catchAsync(async (req, res) => {
    const result = await AdminService.getProviderById(req.params.id);
    UtilFunctions.outputSuccess(res, result, "Service provider retrieved successfully");
  });

  // Patient Management
  static listPatients = catchAsync(async (req, res) => {
    const result = await AdminService.listPatients(req.query);
    UtilFunctions.outputSuccess(res, result, "Patients retrieved successfully");
  });

  static getPatientById = catchAsync(async (req, res) => {
    const result = await AdminService.getPatientById(req.params.id);
    UtilFunctions.outputSuccess(res, result, "Patient retrieved successfully");
  });

  // System Metrics
  static getSystemMetrics = catchAsync(async (req, res) => {
    const result = await AdminService.getSystemMetrics();
    UtilFunctions.outputSuccess(res, result, "System metrics retrieved successfully");
  });

  static getProviderMetricsComparison = catchAsync(async (req, res) => {
    const result = await AdminService.getProviderMetricsComparison(req.query);
    UtilFunctions.outputSuccess(res, result, "Provider metrics comparison retrieved successfully");
  });

  // Community Moderation
  static listCommunities = catchAsync(async (req, res) => {
    const result = await AdminService.listCommunities(req.query);
    UtilFunctions.outputSuccess(res, result, "Communities retrieved successfully");
  });

  static deleteCommunity = catchAsync(async (req, res) => {
    await AdminService.deleteCommunity(req.params.id);
    UtilFunctions.outputSuccess(res, {}, "Community deleted successfully");
  });

  static removeCommunityMember = catchAsync(async (req, res) => {
    await AdminService.removeCommunityMember(req.params.communityId, req.params.userId);
    UtilFunctions.outputSuccess(res, {}, "Community member removed successfully");
  });

  // Assessment Tools
  static listAssessmentTools = catchAsync(async (req, res) => {
    const result = await AdminService.listAssessmentTools(req.query);
    UtilFunctions.outputSuccess(res, result, "Assessment tools retrieved successfully");
  });

  static createAssessmentTool = catchAsync(async (req, res) => {
    const result = await AdminService.createAssessmentTool(req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Assessment tool created successfully");
  });

  static updateAssessmentTool = catchAsync(async (req, res) => {
    const result = await AdminService.updateAssessmentTool(req.params.id, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Assessment tool updated successfully");
  });
}

export default AdminController;
