import { z } from "zod";

export const createGameSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  source: z.enum(["UPLOADED", "YOUTUBE", "EXTERNAL"]).default("UPLOADED"),
  externalUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional().default([]),
  thumbnail: z.string().optional(),
  allowedRoleSlugs: z.array(z.string()).optional().default([]),
  metadata: z.record(z.string(), z.any()).optional().default({})
});

export const updateGameSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  thumbnail: z.string().optional(),
  allowedRoleSlugs: z.array(z.string()).optional()
});
