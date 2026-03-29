import UtilFunctions from "../../utils/UtilFunctions.js";
import CommunityService from "./community.service.js";
import catchAsync from "../../middlewares/catchAsync.js";

class CommunityController {
  /**
   * Create a new community
   */
  static createCommunity = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const community = await CommunityService.createCommunity(
      userId,
      req.body,
      req.files
    );

    return UtilFunctions.outputSuccess(
      res,
      community,
      "Community created successfully",
      201
    );
  });

  /**
   * Get community by ID
   */
  static getCommunityById = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { communityId } = req.params;

    const community = await CommunityService.getCommunityById(
      communityId,
      userId
    );

    return UtilFunctions.outputSuccess(res, community);
  });

  /**
   * Get all communities for current user
   */
  static getUserCommunities = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const result = await CommunityService.getUserCommunities(userId, req.query);

    return UtilFunctions.outputSuccess(res, result);
  });

  /**
   * Update community
   */
  static updateCommunity = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { communityId } = req.params;

    const community = await CommunityService.updateCommunity(
      communityId,
      userId,
      req.body,
      req.files
    );

    return UtilFunctions.outputSuccess(res, community, "Community updated successfully");
  });

  /**
   * Delete community
   */
  static deleteCommunity = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { communityId } = req.params;

    const result = await CommunityService.deleteCommunity(communityId, userId);

    return UtilFunctions.outputSuccess(res, result);
  });

  /**
   * Join community using invite code
   */
  static joinCommunityByInviteCode = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { inviteCode } = req.body;

    const result = await CommunityService.joinCommunityByInviteCode(
      userId,
      inviteCode
    );

    return UtilFunctions.outputSuccess(res, result);
  });

  /**
   * Leave community
   */
  static leaveCommunity = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { communityId } = req.params;

    const result = await CommunityService.leaveCommunity(communityId, userId);

    return UtilFunctions.outputSuccess(res, result);
  });

  /**
   * Update member role
   */
  static updateMemberRole = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { communityId, memberId } = req.params;
    const { role } = req.body;

    const member = await CommunityService.updateMemberRole(
      communityId,
      userId,
      memberId,
      role
    );

    return UtilFunctions.outputSuccess(
      res,
      member,
      "Member role updated successfully"
    );
  });

  /**
   * Ban member from community
   */
  static banMember = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { communityId, memberId } = req.params;

    const result = await CommunityService.banMember(
      communityId,
      userId,
      memberId
    );

    return UtilFunctions.outputSuccess(res, result);
  });

  /**
   * Generate new invite code
   */
  static generateInviteCode = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { communityId } = req.params;

    const result = await CommunityService.generateInviteCode(
      communityId,
      userId
    );

    return UtilFunctions.outputSuccess(
      res,
      result,
      "Invite code generated successfully"
    );
  });

  /**
   * Search public communities
   */
  static searchCommunities = catchAsync(async (req, res) => {
    const { search } = req.query;

    if (!search) {
      return UtilFunctions.outputSuccess(res, {
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
      });
    }

    const result = await CommunityService.searchCommunities(req.query, search);

    return UtilFunctions.outputSuccess(res, result);
  });

  /**
   * Get community members
   */
  static getCommunityMembers = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { communityId } = req.params;

    const result = await CommunityService.getCommunityMembers(
      communityId,
      userId,
      req.query
    );

    return UtilFunctions.outputSuccess(res, result);
  });
}

export default CommunityController;
