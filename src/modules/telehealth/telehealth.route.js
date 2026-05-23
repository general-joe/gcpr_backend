import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import TelehealthController from "./telehealth.controller.js";
import {
  createRoomSchema,
  updateRoomSchema,
  inviteUsersSchema,
  updateRoomStatusSchema
} from "./telehealth.validator.js";

const telehealthRouter = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

telehealthRouter.post(
  "/rooms",
  limiter,
  authorize(["ADMIN", "SERVICE_PROVIDER"]),
  validate(createRoomSchema),
  TelehealthController.createRoom
);

telehealthRouter.get(
  "/rooms",
  limiter,
  authorize(["ADMIN", "SERVICE_PROVIDER", "CAREGIVER"]),
  TelehealthController.listRooms
);

telehealthRouter.get(
  "/rooms/:id",
  limiter,
  authorize(["ADMIN", "SERVICE_PROVIDER", "CAREGIVER"]),
  TelehealthController.getRoomById
);

telehealthRouter.patch(
  "/rooms/:id",
  limiter,
  authorize(["ADMIN", "SERVICE_PROVIDER"]),
  validate(updateRoomSchema),
  TelehealthController.updateRoom
);

telehealthRouter.delete(
  "/rooms/:id",
  limiter,
  authorize(["ADMIN", "SERVICE_PROVIDER"]),
  TelehealthController.cancelRoom
);

telehealthRouter.post(
  "/rooms/:id/invite",
  limiter,
  authorize(["ADMIN", "SERVICE_PROVIDER"]),
  validate(inviteUsersSchema),
  TelehealthController.inviteToRoom
);

telehealthRouter.get(
  "/rooms/:id/participants",
  limiter,
  authorize(["ADMIN", "SERVICE_PROVIDER"]),
  TelehealthController.getParticipants
);

telehealthRouter.post(
  "/rooms/:id/join",
  limiter,
  authorize(["ADMIN", "SERVICE_PROVIDER", "CAREGIVER"]),
  TelehealthController.joinRoom
);

telehealthRouter.get(
  "/rooms/:id/countdown",
  limiter,
  authorize(["ADMIN", "SERVICE_PROVIDER", "CAREGIVER"]),
  TelehealthController.getCountdown
);

telehealthRouter.patch(
  "/rooms/:id/status",
  limiter,
  authorize(["ADMIN", "SERVICE_PROVIDER"]),
  validate(updateRoomStatusSchema),
  TelehealthController.updateRoomStatus
);

export default telehealthRouter;
