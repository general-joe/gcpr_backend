import LogsController from "./logs.controller.js";
import express from "express";
import { requireRbacRole } from "../../middlewares/auth.js";

const logsRouter = express.Router();

logsRouter.get(
  "/",
  requireRbacRole(["ADMIN"]),
  LogsController.listLogs,
);

// SSE stream for live logs (must come before /:filename to avoid param conflict)
logsRouter.get(
  "/stream/live",
  requireRbacRole(["ADMIN"]),
  LogsController.streamLiveLogs,
);

// SSE stream for running migrations
logsRouter.get(
  "/migrate",
  requireRbacRole(["ADMIN"]),
  LogsController.runMigrations,
);

// Execute a read-only SQL query
logsRouter.post(
  "/query",
  requireRbacRole(["ADMIN"]),
  LogsController.runQuery,
);

logsRouter.get(
  "/:filename",
  requireRbacRole(["ADMIN"]),
  LogsController.readLog,
);

export default logsRouter;
