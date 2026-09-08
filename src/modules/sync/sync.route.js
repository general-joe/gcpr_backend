import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import SyncController from "./sync.controller.js";
import { syncPushSchema } from "./sync.validator.js";

const syncRouter = express.Router();

const syncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  message: "Too many sync requests. Please try again later.",
});

// App calls this when connectivity returns to push queued offline work.
// Idempotent: safe to retry the same batch after a network drop.
syncRouter.post(
  "/push",
  syncLimiter,
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  validate(syncPushSchema),
  SyncController.push,
);

export default syncRouter;
