import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import ReportController from "./report.controller.js";
import { createReportSchema, adminUpdateReportSchema } from "./report.validator.js";

const reportRouter = express.Router();
const adminReportRouter = express.Router();

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many reports submitted. Please try again later."
});

// ─── User Report Routes ────────────────────────────────────────────────────────
reportRouter.post(
  "/",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  reportLimiter,
  validate(createReportSchema),
  ReportController.createReport
);

reportRouter.get(
  "/my",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  ReportController.getMyReports
);

reportRouter.get(
  "/:id",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  ReportController.getReport
);

// ─── Admin Report Routes ───────────────────────────────────────────────────────
adminReportRouter.get("/", authorize(["ADMIN"]), ReportController.adminListReports);
adminReportRouter.get("/:id", authorize(["ADMIN"]), ReportController.adminGetReport);
adminReportRouter.patch(
  "/:id",
  authorize(["ADMIN"]),
  validate(adminUpdateReportSchema),
  ReportController.adminUpdateReport
);

export default reportRouter;
export { adminReportRouter };
