import Joi from "joi";

export const createGroupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Group name must be at least 2 characters",
    "string.max": "Group name cannot exceed 100 characters",
    "any.required": "Group name is required",
  }),
  description: Joi.string().max(500).optional().allow("").messages({
    "string.max": "Description cannot exceed 500 characters",
  }),
  isAnnouncementOnly: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid("true", "false"))
    .optional()
    .default(false),
});

export const updateGroupSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    "string.min": "Group name must be at least 2 characters",
    "string.max": "Group name cannot exceed 100 characters",
  }),
  description: Joi.string().max(500).optional().allow("").messages({
    "string.max": "Description cannot exceed 500 characters",
  }),
  isAnnouncementOnly: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid("true", "false"))
    .optional(),
});

export const updateGroupMemberRoleSchema = Joi.object({
  role: Joi.string().valid("ADMIN", "MEMBER").required().messages({
    "any.only": "Role must be either ADMIN or MEMBER",
    "any.required": "Role is required",
  }),
});

export const sendMessageSchema = Joi.object({
  content: Joi.string().max(5000).optional().allow("").messages({
    "string.max": "Message content cannot exceed 5000 characters",
  }),
  type: Joi.string()
    .valid("TEXT", "IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "LOCATION")
    .optional()
    .default("TEXT"),
  mediaUrl: Joi.string().uri().optional().allow("").messages({
    "string.uri": "Invalid media URL",
  }),
  metadata: Joi.object().optional(),
  replyToId: Joi.string().uuid().optional().allow("").messages({
    "string.guid": "Invalid reply message ID",
  }),
});

export const groupIdParamSchema = Joi.object({
  communityId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid community ID",
    "any.required": "Community ID is required",
  }),
  groupId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid group ID",
    "any.required": "Group ID is required",
  }),
});

export const groupMemberIdParamSchema = Joi.object({
  communityId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid community ID",
    "any.required": "Community ID is required",
  }),
  groupId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid group ID",
    "any.required": "Group ID is required",
  }),
  memberId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid member ID",
    "any.required": "Member ID is required",
  }),
});

export const messageIdParamSchema = Joi.object({
  communityId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid community ID",
    "any.required": "Community ID is required",
  }),
  groupId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid group ID",
    "any.required": "Group ID is required",
  }),
  messageId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid message ID",
    "any.required": "Message ID is required",
  }),
});
