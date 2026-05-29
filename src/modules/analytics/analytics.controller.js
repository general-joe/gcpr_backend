import { z } from "zod";
import catchAsync from "../../middlewares/catchAsync.js";
import AnalyticsService from "./analytics.service.js";

const filterSchema = z.object({
  filter: z.enum(["today", "this_week", "this_month", "all_time"]).default("this_week"),
});

class AnalyticsController {
  getAdminDashboard = catchAsync(async (req, res) => {
    const { filter } = filterSchema.parse(req.query);
    const data = await AnalyticsService.getAdminAnalytics(filter);
    
    res.status(200).json({
      status: "success",
      data,
    });
  });

  getProviderDashboard = catchAsync(async (req, res) => {
    const { filter } = filterSchema.parse(req.query);
    const providerId = req.user?.serviceProvider?.id || req.user?.id; // Assuming user injects serviceProvider
    const data = await AnalyticsService.getProviderAnalytics(filter, providerId);

    res.status(200).json({
      status: "success",
      data,
    });
  });

  getSupportDashboard = catchAsync(async (req, res) => {
    const { filter } = filterSchema.parse(req.query);
    const data = await AnalyticsService.getSupportAnalytics(filter);

    res.status(200).json({
      status: "success",
      data,
    });
  });
}

export default new AnalyticsController();
