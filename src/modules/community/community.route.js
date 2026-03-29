import express from "express";
import CommunityController from "./community.controller.js";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import upload from "../../middlewares/upload.js";
import {
  createCommunitySchema,
  updateCommunitySchema,
  joinCommunitySchema,
  updateMemberRoleSchema,
  communityIdParamSchema,
  memberIdParamSchema,
} from "./community.validator.js";

const communityRouter = express.Router();

// All routes require authentication
communityRouter.use(authorize(["SERVICE_PROVIDER", "CAREGIVER"]));

// Community CRUD
communityRouter.post(
  "/",
  upload.fields([{ name: "image" }]),
  validate(createCommunitySchema),
  CommunityController.createCommunity
);

communityRouter.get("/", CommunityController.getUserCommunities);

communityRouter.get(
  "/search",
  CommunityController.searchCommunities
);

communityRouter.get(
  "/:communityId",
  validate(communityIdParamSchema, "params"),
  CommunityController.getCommunityById
);

communityRouter.put(
  "/:communityId",
  upload.fields([{ name: "image" }]),
  validate(communityIdParamSchema, "params"),
  validate(updateCommunitySchema),
  CommunityController.updateCommunity
);

communityRouter.delete(
  "/:communityId",
  validate(communityIdParamSchema, "params"),
  CommunityController.deleteCommunity
);

// Join/Leave community
communityRouter.post(
  "/join",
  validate(joinCommunitySchema),
  CommunityController.joinCommunityByInviteCode
);

communityRouter.post(
  "/:communityId/leave",
  validate(communityIdParamSchema, "params"),
  CommunityController.leaveCommunity
);

// Member management
communityRouter.get(
  "/:communityId/members",
  validate(communityIdParamSchema, "params"),
  CommunityController.getCommunityMembers
);

communityRouter.put(
  "/:communityId/members/:memberId/role",
  validate(memberIdParamSchema, "params"),
  validate(updateMemberRoleSchema),
  CommunityController.updateMemberRole
);

communityRouter.post(
  "/:communityId/members/:memberId/ban",
  validate(memberIdParamSchema, "params"),
  CommunityController.banMember
);

// Invite code management
communityRouter.post(
  "/:communityId/invite-code",
  validate(communityIdParamSchema, "params"),
  CommunityController.generateInviteCode
);

export default communityRouter;
