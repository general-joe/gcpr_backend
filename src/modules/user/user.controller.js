import UtilFunctions from "../../utils/UtilFunctions.js";
import UserService from "./user.service.js";
import catchAsync from "../../middlewares/catchAsync.js";

/**
 * User Controller - Handles user-related HTTP requests
 * Manages user profile and YouTube video operations with role-based access
 */
class UserController {
  /**
   * Get user profile
   * Available to: SERVICE_PROVIDER, CAREGIVER
   */
  static getProfile = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;

    if (!userId) {
      return UtilFunctions.outputError(res, "Unauthorized", {}, undefined, 401);
    }

    const user = await UserService.getProfile(userId);

    return UtilFunctions.outputSuccess(res, { user }, "Profile fetched");
  });

  /**
   * List all videos from the YouTube channel
   * Available to: ALL USERS (SERVICE_PROVIDER and CAREGIVER)
   *
   * Query Parameters:
   *  - pageSize: number of videos per page (default: 25)
   *  - pageToken: pagination token for next page
   *  - order: video ordering ('date', 'rating', 'relevance', 'title', 'videoCount', 'viewCount')
   *
   * @returns {Object} List of videos with pagination info
   * @example
   * GET /users/videos?pageSize=10&order=date
   */
  static listVideos = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;

    if (!userId) {
      return UtilFunctions.outputError(res, "Unauthorized", {}, undefined, 401);
    }

    const { pageSize, pageToken, order } = req.query;

    const options = {};
    if (pageSize) options.pageSize = parseInt(pageSize);
    if (pageToken) options.pageToken = pageToken;
    if (order) options.order = order;

    const videos = await UserService.listChannelVideos(options);

    return UtilFunctions.outputSuccess(
      res,
      { videos },
      "Videos retrieved successfully",
    );
  });

  /**
   * Deactivate user account (soft delete)
   * Available to: SERVICE_PROVIDER, CAREGIVER (users can deactivate their own account)
   */
  static deactivateAccount = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;

    if (!userId) {
      return UtilFunctions.outputError(res, "Unauthorized", {}, undefined, 401);
    }

    const user = await UserService.deactivateAccount(userId);

    return UtilFunctions.outputSuccess(res, { user }, "Account deactivated successfully");
  });

  /**
   * Delete user account (soft delete)
   * Available to: SERVICE_PROVIDER, CAREGIVER (users can delete their own account)
   */
  static deleteUserAccount = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;

    if (!userId) {
      return UtilFunctions.outputError(res, "Unauthorized", {}, undefined, 401);
    }

    const user = await UserService.deleteUserAccount(userId);

    return UtilFunctions.outputSuccess(res, { user }, "Account deleted successfully");
  });
}

export default UserController;
