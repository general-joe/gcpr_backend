import { z } from "zod";

// POST /care-plan/generate/:assessmentId previously had no validator at all.
export const generateCarePlanParamsSchema = z.object({
  assessmentId: z.string().uuid("assessmentId must be a valid UUID"),
});
