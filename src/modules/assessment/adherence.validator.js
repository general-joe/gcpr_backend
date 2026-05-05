import { z } from "zod";

export const markLogCompletedSchema = z.object({
  logDate: z.coerce.date(),
  notes: z.string().max(500).optional()
});

export const updateLogSchema = z.object({
  status: z.enum(["EXCUSED", "PARTIAL", "COMPLETED", "MISSED"]).optional(),
  notes: z.string().max(500).optional()
});
