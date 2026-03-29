import UtilFunctions from "../../utils/UtilFunctions.js";
import CommunityAnnouncementService from "./communityAnnouncement.service.js";
import catchAsync from "../../middlewares/catchAsync.js";

class CommunityAnnouncementController {
  /**
   * Create a new announcement
   */
  static createAnnouncement = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { communityId } = req.params;

    const announcement = await CommunityAnnouncementService.createAnnouncement(
      communityId,
      userId,
      req.body,
      req.files
    );

    return UtilFunctions.outputSuccess(
      res,
      announcement,
      "Announcement created successfully",
      201
    );
  });

  /**
   * Get all announcements for a community
   */
  static getCommunityAnnouncements = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { communityId } = req.params;

    const result = await CommunityAnnouncementService.getCommunityAnnouncements(
      communityId,
      userId,
      req.query
    );

    return UtilFunctions.outputSuccess(res, result);
  });

  /**
   * Get announcement by ID
   */
  static getAnnouncementById = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { announcementId } = req.params;

    const announcement = await CommunityAnnouncementService.getAnnouncementById(
      announcementId,
      userId
    );

    return UtilFunctions.outputSuccess(res, announcement);
  });

  /**
   * Update announcement
   */
  static updateAnnouncement = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { announcementId } = req.params;

    const announcement = await CommunityAnnouncementService.updateAnnouncement(
      announcementId,
      userId,
      req.body,
      req.files
    );

    return UtilFunctions.outputSuccess(
      res,
      announcement,
      "Announcement updated successfully"
    );
  });

  /**
   * Delete announcement
   */
  static deleteAnnouncement = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { announcementId } = req.params;

    const result = await CommunityAnnouncementService.deleteAnnouncement(
      announcementId,
      userId
    );

    return UtilFunctions.outputSuccess(res, result);
  });

  /**
   * Toggle pin announcement
   */
  static togglePinAnnouncement = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { announcementId } = req.params;

    const announcement =
      await CommunityAnnouncementService.togglePinAnnouncement(
        announcementId,
        userId
      );

    return UtilFunctions.outputSuccess(
      res,
      announcement,
      `Announcement ${announcement.isPinned ? "pinned" : "unpinned"} successfully`
    );
  });
}

export default CommunityAnnouncementController;
