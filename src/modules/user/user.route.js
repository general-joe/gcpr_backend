import express from "express";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import { acceptTermsSchema } from "./user.validator.js";

import UserController from "./user.controller.js";

const userRouter = express.Router();

/**
 * GET /users/profile
 * Get user profile
 * Available to: SERVICE_PROVIDER, CAREGIVER, ADMIN
 */
userRouter.get(
  "/profile",
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
  UserController.getProfile,
);

/**
 * GET /users/videos
 * List all videos from the YouTube channel with database caching
 * Available to: ALL USERS (SERVICE_PROVIDER, CAREGIVER, ADMIN)
 *
 * Query Parameters:
 *  - pageSize: number of videos per page (default: 25)
 *  - pageToken: pagination token for next page
 *  - order: video ordering ('date', 'rating', 'relevance', 'title', 'videoCount', 'viewCount')
 */
userRouter.get(
  "/videos",
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
  UserController.listVideos,
);

/**
 * POST /users/deactivate-account
 * Deactivate user account (soft delete)
 * Available to: SERVICE_PROVIDER, CAREGIVER (users can deactivate their own account)
 */
userRouter.post(
  "/deactivate-account",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  UserController.deactivateAccount,
);

  /**
  * PATCH /users/accept-terms
  * Versioned re-acceptance of Terms + Privacy Policy (both must be true).
  * Available to: SERVICE_PROVIDER, CAREGIVER, ADMIN
  */
userRouter.patch(
  "/accept-terms",
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
  validate(acceptTermsSchema),
  UserController.acceptTerms,
);

  /**
  * POST /users/delete-account
 * Delete user account (soft delete)
 * Available to: SERVICE_PROVIDER, CAREGIVER (users can delete their own account)
 */
userRouter.post(
  "/delete-account",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  UserController.deleteUserAccount,
);

export default userRouter;
