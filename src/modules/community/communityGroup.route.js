import express from "express";
import CommunityGroupController from "./communityGroup.controller.js";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import upload from "../../middlewares/upload.js";
import {
  createGroupSchema,
  updateGroupSchema,
  updateGroupMemberRoleSchema,
  sendMessageSchema,
  groupIdParamSchema,
  groupMemberIdParamSchema,
  messageIdParamSchema,
} from "./communityGroup.validator.js";

const communityGroupRouter = express.Router({ mergeParams: true });

// All routes require authentication
communityGroupRouter.use(authorize(["SERVICE_PROVIDER", "CAREGIVER"]));

// Group CRUD
communityGroupRouter.post(
  "/",
  upload.fields([{ name: "image" }]),
  validate(createGroupSchema),
  CommunityGroupController.createGroup
);

communityGroupRouter.get("/", CommunityGroupController.getCommunityGroups);

communityGroupRouter.get(
  "/:groupId",
  validate(groupIdParamSchema, "params"),
  CommunityGroupController.getGroupById
);

communityGroupRouter.put(
  "/:groupId",
  upload.fields([{ name: "image" }]),
  validate(groupIdParamSchema, "params"),
  validate(updateGroupSchema),
  CommunityGroupController.updateGroup
);

communityGroupRouter.delete(
  "/:groupId",
  validate(groupIdParamSchema, "params"),
  CommunityGroupController.deleteGroup
);

// Join/Leave group
communityGroupRouter.post(
  "/:groupId/join",
  validate(groupIdParamSchema, "params"),
  CommunityGroupController.joinGroup
);

communityGroupRouter.post(
  "/:groupId/leave",
  validate(groupIdParamSchema, "params"),
  CommunityGroupController.leaveGroup
);

// Group member management
communityGroupRouter.put(
  "/:groupId/members/:memberId/role",
  validate(groupMemberIdParamSchema, "params"),
  validate(updateGroupMemberRoleSchema),
  CommunityGroupController.updateGroupMemberRole
);

communityGroupRouter.delete(
  "/:groupId/members/:memberId",
  validate(groupMemberIdParamSchema, "params"),
  CommunityGroupController.removeGroupMember
);

// Messages
communityGroupRouter.get(
  "/:groupId/messages",
  validate(groupIdParamSchema, "params"),
  CommunityGroupController.getGroupMessages
);

communityGroupRouter.post(
  "/:groupId/messages",
  validate(groupIdParamSchema, "params"),
  validate(sendMessageSchema),
  CommunityGroupController.sendMessage
);

communityGroupRouter.delete(
  "/:groupId/messages/:messageId",
  validate(messageIdParamSchema, "params"),
  CommunityGroupController.deleteMessage
);

export default communityGroupRouter;
