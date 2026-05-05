import { z } from "zod";

export const createReportSchema = z.object({
  reportType: z.enum(["SERVICE_PROVIDER", "SYSTEM_ISSUE", "BUG_REPORT", "CONTENT", "OTHER"]),
  targetUserId: z.string().uuid().optional(),
  subject: z.string().min(5).max(200),
  description: z.string().min(10),
  evidence: z.array(z.string().url()).optional().default([])
});

export const adminUpdateReportSchema = z.object({
  status: z.enum(["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]).optional(),
  adminNotes: z.string().optional()
});
