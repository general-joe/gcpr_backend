import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import upload from "../../middlewares/upload.js";
import GameController from "./game.controller.js";

const gameRouter = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

gameRouter.post(
  "/",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  upload.single("file"),
  GameController.createGame
);

gameRouter.get(
  "/",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  GameController.listGames
);

gameRouter.get(
  "/selectable",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  GameController.listSelectableGames
);

gameRouter.get(
  "/patients/:patientId/assignments",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  GameController.listPatientAssignments
);

gameRouter.get(
  "/patients/:patientId/improvement",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  GameController.getImprovementSummary
);

gameRouter.get(
  "/:id",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  GameController.getGameById
);

gameRouter.post(
  "/:id/assign",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  GameController.assignGame
);

gameRouter.post(
  "/:id/participation",
  limiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  GameController.logParticipation
);

gameRouter.patch(
  "/:id",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  GameController.updateGame
);

gameRouter.delete(
  "/:id",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  GameController.deleteGame
);

gameRouter.post(
  "/:id/publish",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  GameController.publishGame
);

gameRouter.post(
  "/:id/unpublish",
  limiter,
  authorize(["SERVICE_PROVIDER"]),
  GameController.unpublishGame
);

export default gameRouter;
