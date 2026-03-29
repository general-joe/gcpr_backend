import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters"),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(5000, "Content cannot exceed 5000 characters"),
  isPinned: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .default(false)
    .transform((val) => {
      if (typeof val === "string") {
        return val === "true";
      }
      return val;
    }),
});

export const updateAnnouncementSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(5000, "Content cannot exceed 5000 characters")
    .optional(),
  isPinned: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((val) => {
      if (typeof val === "string") {
        return val === "true";
      }
      return val;
    }),
});

export const announcementIdParamSchema = z.object({
  communityId: z.string().uuid("Invalid community ID"),
  announcementId: z.string().uuid("Invalid announcement ID"),
});
