import { z } from "zod";

const referralSchema = z
  .object({
    toProfession: z.enum([
      "GENERAL_PAEDIATRICIAN",
      "DEVELOPMENTAL_PAEDIATRICIAN",
      "PAEDIATRIC_NEUROLOGIST",
      "NEURODEVELOPMENTAL_PAEDIATRICIAN",
      "REHABILITATION_PAEDIATRICIAN",
      "PHYSIOTHERAPIST",
      "OCCUPATIONAL_THERAPIST",
      "SPEECH_THERAPIST",
      "CLINICAL_PSYCHOLOGIST",
      "DIETITIAN",
      "PHARMACIST"
    ]),
    toProviderId: z.string().uuid(),
    reason: z.string().min(10).max(1000)
  })
  .strict();

export const submitAssessmentSchema = z.object({
  patientId: z.string().uuid(),

  toolCode: z.string().min(1),

  toolVersion: z.string().optional(),

  status: z.enum(["DRAFT", "COMPLETED"]).optional(),

  responses: z
    .record(z.string(), z.any())
    .refine(
      (val) => Object.keys(val).length > 0,
      "Responses cannot be empty"
    ),

  referral: referralSchema.optional()
});

export const updateReferralStatusSchema = z
  .object({
    status: z.enum(["ACCEPTED", "DECLINED", "COMPLETED"])
  })
  .strict();

export const createRehabTaskSchema = z
  .object({
    title: z.string().min(3).max(150),
    instructions: z.string().min(5).max(3000),
    instructionSteps: z.array(z.string().min(1)).optional(),
    frequencyPerDay: z.number().int().min(1).max(10).optional(),
    frequencyNote: z.string().max(255).optional(),
    durationDays: z.number().int().min(1).max(365),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    video: z.record(z.string(), z.any()).optional()
  })
  .refine(
    (payload) =>
      !payload.startDate ||
      !payload.endDate ||
      payload.endDate.getTime() >= payload.startDate.getTime(),
    "endDate must be greater than or equal to startDate"
  )
  .strict();
