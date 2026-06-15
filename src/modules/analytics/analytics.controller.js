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
    const providerId = res.locals.user?.serviceProviderId;
    
    if (!providerId) {
      // User is authenticated (e.g. admin) but has no service provider profile.
      // Return empty/default analytics instead of erroring.
      return res.status(200).json({
        status: "success",
        data: {
          kpis: {
            sessionsCompleted: { count: 0, averageRating: 0 },
            referrals: { pending: 0, approved: 0, declined: 0 },
            carePlanAdherence: { onTrackPercentage: 0, atRiskPercentage: 0 },
            assignedTasks: { open: 0, done: 0 },
            approvals: { pending: 0, approved: 0, rejected: 0 },
          },
          charts: {
            patientProgress: [],
            adherenceTrend: [],
            assignedDailyTasks: [],
            patientRecovery: { improved: 0, stable: 0, regressed: 0 },
          },
        },
      });
    }
    
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
