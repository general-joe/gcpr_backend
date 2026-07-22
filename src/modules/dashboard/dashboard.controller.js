import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import DashboardService from "./dashboard.service.js";

export const caregiverDashboard = catchAsync(async (req, res) => {
  const data = await DashboardService.caregiverDashboard(res.locals.user);
  return UtilFunctions.outputSuccess(res, data, "Caregiver dashboard retrieved successfully");
});

export const providerDashboard = catchAsync(async (req, res) => {
  const data = await DashboardService.providerDashboard(res.locals.user);
  return UtilFunctions.outputSuccess(res, data, "Provider dashboard retrieved successfully");
});
