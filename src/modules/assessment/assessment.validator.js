import { z } from "zod";

export const submitAssessmentSchema = z.object({
  patientId: z.string(),

  toolCode: z.string().min(1),

  toolVersion: z.string().optional(),

  status: z.enum(["DRAFT", "COMPLETED"]).optional(),

  responses: z
    .record(z.string(), z.any())
    .refine(
      (val) => Object.keys(val).length > 0,
      "Responses cannot be empty"
    )
});
