import { z } from "zod";

const classifierEnum = z.enum([
  "GMFCS",
  "MACS",
  "CFCS",
  "EDACS",
  "VIKING_SPEECH_SCALE",
  "OTHER",
]);

export const createFunctionalClassificationSchema = z
  .object({
    patientId: z.string().uuid("patientId must be a valid UUID"),
    classifier: classifierEnum,
    level: z
      .number()
      .int()
      .min(1, "Level must be between 1 and 5")
      .max(5, "Level must be between 1 and 5"),
    assessedAt: z.coerce.date(),
    notes: z.string().max(1000).optional(),
  })
  .strict();

export const updateFunctionalClassificationSchema = z
  .object({
    level: z.number().int().min(1).max(5).optional(),
    assessedAt: z.coerce.date().optional(),
    notes: z.string().max(1000).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided"
  );

export const listFunctionalClassificationsQuerySchema = z
  .object({
    classifier: classifierEnum.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();
