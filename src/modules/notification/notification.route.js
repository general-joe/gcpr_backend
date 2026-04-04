import express from "express";
import { authorize } from "../../middlewares/auth.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import NotificationService from "./notification.service.js";
import catchAsync from "../../middlewares/catchAsync.js";

const notificationRouter = express.Router();

// Apply authentication to all routes
notificationRouter.use(authorize(["SERVICE_PROVIDER", "CAREGIVER"]));

// ── Static paths first (before /:id params) ──

// Get user's notifications
notificationRouter.get(
  "/",
  catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const result = await NotificationService.getUserNotifications(
      userId,
      parseInt(page),
      parseInt(limit),
      unreadOnly === "true"
    );
    
    UtilFunctions.outputSuccess(res, result, "Notifications retrieved successfully");
  })
);

// Get unread notification count
notificationRouter.get(
  "/unread-count",
  catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const count = await NotificationService.getUnreadCount(userId);
    UtilFunctions.outputSuccess(res, { count }, "Unread count retrieved successfully");
  })
);

// Mark all notifications as read
notificationRouter.put(
  "/read-all",
  catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    await NotificationService.markAllAsRead(userId);
    UtilFunctions.outputSuccess(res, {}, "All notifications marked as read");
  })
);

// Get push notification token
notificationRouter.get(
  "/push-token",
  catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const token = await NotificationService.getPushToken(userId);
    UtilFunctions.outputSuccess(res, { token }, "Push token retrieved successfully");
  })
);

// Register/update push notification token
notificationRouter.post(
  "/push-token",
  catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { token, deviceType, deviceId } = req.body;
    
    if (!token) {
      return UtilFunctions.outputError(res, "Token is required");
    }
    
    await NotificationService.registerPushToken(userId, token, deviceType, deviceId);
    UtilFunctions.outputSuccess(res, {}, "Push token registered successfully");
  })
);

// Remove push notification token
notificationRouter.delete(
  "/push-token",
  catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    await NotificationService.removePushToken(userId);
    UtilFunctions.outputSuccess(res, {}, "Push token removed successfully");
  })
);

// ── Parameterized routes (after static paths) ──

// Mark notification as read
notificationRouter.put(
  "/:id/read",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = res.locals.user.id;
    
    await NotificationService.markAsRead(id, userId);
    UtilFunctions.outputSuccess(res, {}, "Notification marked as read");
  })
);

// Archive notification
notificationRouter.put(
  "/:id/archive",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = res.locals.user.id;
    
    await NotificationService.archive(id, userId);
    UtilFunctions.outputSuccess(res, {}, "Notification archived");
  })
);

// Delete notification
notificationRouter.delete(
  "/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = res.locals.user.id;
    
    await NotificationService.deleteNotification(id, userId);
    UtilFunctions.outputSuccess(res, {}, "Notification deleted");
  })
);

export default notificationRouter;