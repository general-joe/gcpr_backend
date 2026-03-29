import Joi from "joi";

export const createAnnouncementSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    "string.min": "Title must be at least 3 characters",
    "string.max": "Title cannot exceed 200 characters",
    "any.required": "Title is required",
  }),
  content: Joi.string().min(10).max(5000).required().messages({
    "string.min": "Content must be at least 10 characters",
    "string.max": "Content cannot exceed 5000 characters",
    "any.required": "Content is required",
  }),
  isPinned: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid("true", "false"))
    .optional()
    .default(false),
});

export const updateAnnouncementSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional().messages({
    "string.min": "Title must be at least 3 characters",
    "string.max": "Title cannot exceed 200 characters",
  }),
  content: Joi.string().min(10).max(5000).optional().messages({
    "string.min": "Content must be at least 10 characters",
    "string.max": "Content cannot exceed 5000 characters",
  }),
  isPinned: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid("true", "false"))
    .optional(),
});

export const announcementIdParamSchema = Joi.object({
  communityId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid community ID",
    "any.required": "Community ID is required",
  }),
  announcementId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid announcement ID",
    "any.required": "Announcement ID is required",
  }),
});
