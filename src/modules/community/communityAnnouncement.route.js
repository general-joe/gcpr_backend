import express from "express";
import CommunityAnnouncementController from "./communityAnnouncement.controller.js";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import upload from "../../middlewares/upload.js";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  announcementIdParamSchema,
} from "./communityAnnouncement.validator.js";

const communityAnnouncementRouter = express.Router({ mergeParams: true });

// All routes require authentication
communityAnnouncementRouter.use(authorize(["SERVICE_PROVIDER", "CAREGIVER"]));

// Announcement CRUD
communityAnnouncementRouter.post(
  "/",
  upload.fields([{ name: "media" }]),
  validate(createAnnouncementSchema),
  CommunityAnnouncementController.createAnnouncement
);

communityAnnouncementRouter.get(
  "/",
  CommunityAnnouncementController.getCommunityAnnouncements
);

communityAnnouncementRouter.get(
  "/:announcementId",
  validate(announcementIdParamSchema, "params"),
  CommunityAnnouncementController.getAnnouncementById
);

communityAnnouncementRouter.put(
  "/:announcementId",
  upload.fields([{ name: "media" }]),
  validate(announcementIdParamSchema, "params"),
  validate(updateAnnouncementSchema),
  CommunityAnnouncementController.updateAnnouncement
);

communityAnnouncementRouter.delete(
  "/:announcementId",
  validate(announcementIdParamSchema, "params"),
  CommunityAnnouncementController.deleteAnnouncement
);

// Pin/Unpin announcement
communityAnnouncementRouter.post(
  "/:announcementId/pin",
  validate(announcementIdParamSchema, "params"),
  CommunityAnnouncementController.togglePinAnnouncement
);

export default communityAnnouncementRouter;
