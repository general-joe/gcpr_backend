import { z } from "zod";

const toolCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[A-Z0-9_]+$/, "code must be UPPER_SNAKE (e.g. GMFM_88)");

const fieldTypeEnum = z.enum([
  "SINGLE_CHOICE",
  "MULTI_CHOICE",
  "SCALE_1_5",
  "NUMBER",
  "TEXT",
  "DATE",
  "BOOLEAN",
  "FILE_UPLOAD",
]);

const scoringStrategyEnum = z.enum(["SUM", "WEIGHTED_SUM", "RUBRIC", "CUSTOM_FN_REF"]);

export const createDraftSchema = z.object({
  code: toolCodeSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  applicableScales: z.array(z.string().min(1)).optional().default([]),
  allowedProfessions: z.array(z.string().min(1)).optional().default([]),
  scoringStrategy: scoringStrategyEnum.optional(),
  customFnRef: z.string().max(120).optional().nullable(),
});

export const updateDraftSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  applicableScales: z.array(z.string().min(1)).optional(),
  allowedProfessions: z.array(z.string().min(1)).optional(),
  scoringStrategy: scoringStrategyEnum.optional(),
  customFnRef: z.string().max(120).optional().nullable(),
  status: z.enum(["DRAFT", "ARCHIVED"]).optional(),
});

export const sectionSchema = z.object({
  order: z.number().int().min(0).optional(),
  code: z.string().max(80).optional().nullable(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
});

export const updateSectionSchema = sectionSchema.partial().refine(
  (d) => Object.keys(d).length > 0,
  "At least one field must be provided",
);

const optionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  score: z.number().optional(),
});

export const fieldSchema = z.object({
  fieldKey: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[A-Za-z][A-Za-z0-9_]*$/, "fieldKey must be a stable identifier"),
  order: z.number().int().min(0).optional(),
  label: z.string().min(1).max(300),
  helpText: z.string().max(1000).optional().nullable(),
  fieldType: fieldTypeEnum,
  options: z.array(optionSchema).optional(),
  validation: z.record(z.string(), z.any()).optional(),
  scoringWeight: z.number().optional().nullable(),
});

export const updateFieldSchema = z
  .object({
    order: z.number().int().min(0).optional(),
    label: z.string().min(1).max(300).optional(),
    helpText: z.string().max(1000).optional().nullable(),
    fieldType: fieldTypeEnum.optional(),
    options: z.array(optionSchema).optional(),
    validation: z.record(z.string(), z.any()).optional(),
    scoringWeight: z.number().optional().nullable(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, "At least one field must be provided");
