import Joi from "joi";

export const createCommunitySchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.min": "Community name must be at least 3 characters",
    "string.max": "Community name cannot exceed 100 characters",
    "any.required": "Community name is required",
  }),
  description: Joi.string().max(500).optional().allow("").messages({
    "string.max": "Description cannot exceed 500 characters",
  }),
  isPublic: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid("true", "false"))
    .optional()
    .default(false),
  maxMembers: Joi.number().integer().min(2).max(10000).optional().default(1000).messages({
    "number.min": "Maximum members must be at least 2",
    "number.max": "Maximum members cannot exceed 10000",
  }),
});

export const updateCommunitySchema = Joi.object({
  name: Joi.string().min(3).max(100).optional().messages({
    "string.min": "Community name must be at least 3 characters",
    "string.max": "Community name cannot exceed 100 characters",
  }),
  description: Joi.string().max(500).optional().allow("").messages({
    "string.max": "Description cannot exceed 500 characters",
  }),
  isPublic: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid("true", "false"))
    .optional(),
  maxMembers: Joi.number().integer().min(2).max(10000).optional().messages({
    "number.min": "Maximum members must be at least 2",
    "number.max": "Maximum members cannot exceed 10000",
  }),
});

export const joinCommunitySchema = Joi.object({
  inviteCode: Joi.string().min(6).max(20).required().messages({
    "string.min": "Invalid invite code",
    "string.max": "Invalid invite code",
    "any.required": "Invite code is required",
  }),
});

export const updateMemberRoleSchema = Joi.object({
  role: Joi.string().valid("ADMIN", "MEMBER").required().messages({
    "any.only": "Role must be either ADMIN or MEMBER",
    "any.required": "Role is required",
  }),
});

export const communityIdParamSchema = Joi.object({
  communityId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid community ID",
    "any.required": "Community ID is required",
  }),
});

export const memberIdParamSchema = Joi.object({
  communityId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid community ID",
    "any.required": "Community ID is required",
  }),
  memberId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid member ID",
    "any.required": "Member ID is required",
  }),
});
