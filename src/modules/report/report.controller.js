import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import ReportService from "./report.service.js";

export default class ReportController {
  static createReport = catchAsync(async (req, res) => {
    const result = await ReportService.createReport(res.locals.user.id, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Report submitted successfully");
  });

  static getMyReports = catchAsync(async (req, res) => {
    const result = await ReportService.getMyReports(res.locals.user.id, req.query);
    UtilFunctions.outputSuccess(res, result, "Reports retrieved successfully");
  });

  static getReport = catchAsync(async (req, res) => {
    const result = await ReportService.getReport(res.locals.user.id, req.params.id);
    UtilFunctions.outputSuccess(res, result, "Report retrieved successfully");
  });

  static adminListReports = catchAsync(async (req, res) => {
    const result = await ReportService.adminListReports(req.query);
    UtilFunctions.outputSuccess(res, result, "Reports retrieved successfully");
  });

  static adminGetReport = catchAsync(async (req, res) => {
    const result = await ReportService.adminGetReport(req.params.id);
    UtilFunctions.outputSuccess(res, result, "Report retrieved successfully");
  });

  static adminUpdateReport = catchAsync(async (req, res) => {
    const result = await ReportService.adminUpdateReport(
      res.locals.user.id,
      req.params.id,
      req.validatedData ?? req.body
    );
    UtilFunctions.outputSuccess(res, result, "Report updated successfully");
  });

  static downloadReports = catchAsync(async (req, res) => {
    const result = await ReportService.downloadReports(res.locals.user.id, req.query);
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  });
}
