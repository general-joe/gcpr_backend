import { z } from "zod";

export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Community name must be at least 3 characters")
    .max(100, "Community name cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default(""),
  isPublic: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .default(false)
    .transform((val) => {
      if (typeof val === "string") {
        return val === "true";
      }
      return val;
    }),
  maxMembers: z
    .number()
    .int()
    .min(2, "Maximum members must be at least 2")
    .max(10000, "Maximum members cannot exceed 10000")
    .optional()
    .default(1000),
});

export const updateCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Community name must be at least 3 characters")
    .max(100, "Community name cannot exceed 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default(""),
  isPublic: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((val) => {
      if (typeof val === "string") {
        return val === "true";
      }
      return val;
    }),
  maxMembers: z
    .number()
    .int()
    .min(2, "Maximum members must be at least 2")
    .max(10000, "Maximum members cannot exceed 10000")
    .optional(),
});

export const joinCommunitySchema = z.object({
  inviteCode: z
    .string()
    .min(6, "Invalid invite code")
    .max(20, "Invalid invite code"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"], {
    errorMap: () => ({ message: "Role must be either ADMIN or MEMBER" }),
  }),
});

export const communityIdParamSchema = z.object({
  communityId: z.string().uuid("Invalid community ID"),
});

export const memberIdParamSchema = z.object({
  communityId: z.string().uuid("Invalid community ID"),
  memberId: z.string().uuid("Invalid member ID"),
});
