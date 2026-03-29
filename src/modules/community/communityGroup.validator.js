import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, "Group name must be at least 2 characters")
    .max(100, "Group name cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default(""),
  isAnnouncementOnly: z
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

export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(2, "Group name must be at least 2 characters")
    .max(100, "Group name cannot exceed 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default(""),
  isAnnouncementOnly: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((val) => {
      if (typeof val === "string") {
        return val === "true";
      }
      return val;
    }),
});

export const updateGroupMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"], {
    errorMap: () => ({ message: "Role must be either ADMIN or MEMBER" }),
  }),
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .max(5000, "Message content cannot exceed 5000 characters")
    .optional()
    .default(""),
  type: z
    .enum(["TEXT", "IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "LOCATION"])
    .optional()
    .default("TEXT"),
  mediaUrl: z.string().url("Invalid media URL").optional().default(""),
  metadata: z.record(z.any()).optional(),
  replyToId: z.string().uuid("Invalid reply message ID").optional().default(""),
});

export const groupIdParamSchema = z.object({
  communityId: z.string().uuid("Invalid community ID"),
  groupId: z.string().uuid("Invalid group ID"),
});

export const groupMemberIdParamSchema = z.object({
  communityId: z.string().uuid("Invalid community ID"),
  groupId: z.string().uuid("Invalid group ID"),
  memberId: z.string().uuid("Invalid member ID"),
});

export const messageIdParamSchema = z.object({
  communityId: z.string().uuid("Invalid community ID"),
  groupId: z.string().uuid("Invalid group ID"),
  messageId: z.string().uuid("Invalid message ID"),
});
