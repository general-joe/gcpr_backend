import express from "express";
import rateLimit from "express-rate-limit";
import { requireRbacRole } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validation.js";
import ToolDefinitionController from "./toolDefinition.controller.js";
import {
  createDraftSchema,
  updateDraftSchema,
  sectionSchema,
  updateSectionSchema,
  fieldSchema,
  updateFieldSchema,
} from "./toolDefinition.validator.js";

const adminToolsRouter = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const adminOnly = requireRbacRole(["ADMIN"]);

adminToolsRouter.get("/", limiter, adminOnly, ToolDefinitionController.list);
adminToolsRouter.post("/", limiter, adminOnly, validate(createDraftSchema), ToolDefinitionController.create);
adminToolsRouter.get("/:id", limiter, adminOnly, ToolDefinitionController.get);
adminToolsRouter.patch("/:id", limiter, adminOnly, validate(updateDraftSchema), ToolDefinitionController.update);
adminToolsRouter.get("/:id/preview", limiter, adminOnly, ToolDefinitionController.preview);
adminToolsRouter.post("/:id/publish", limiter, adminOnly, ToolDefinitionController.publish);
adminToolsRouter.post("/:id/sections", limiter, adminOnly, validate(sectionSchema), ToolDefinitionController.addSection);
adminToolsRouter.patch(
  "/sections/:sectionId",
  limiter,
  adminOnly,
  validate(updateSectionSchema),
  ToolDefinitionController.updateSection,
);
adminToolsRouter.delete("/sections/:sectionId", limiter, adminOnly, ToolDefinitionController.deleteSection);
adminToolsRouter.post(
  "/:id/sections/:sectionId/fields",
  limiter,
  adminOnly,
  validate(fieldSchema),
  ToolDefinitionController.addField,
);
adminToolsRouter.patch(
  "/fields/:fieldId",
  limiter,
  adminOnly,
  validate(updateFieldSchema),
  ToolDefinitionController.updateField,
);
adminToolsRouter.delete("/fields/:fieldId", limiter, adminOnly, ToolDefinitionController.deleteField);

export default adminToolsRouter;
