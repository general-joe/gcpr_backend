import UtilFunctions from "../../utils/UtilFunctions.js";
import CommunityGroupService from "./communityGroup.service.js";
import catchAsync from "../../middlewares/catchAsync.js";

class CommunityGroupController {
  /**
   * Create a new group in community
   */
  static createGroup = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { communityId } = req.params;

    const group = await CommunityGroupService.createGroup(
      communityId,
      userId,
      req.body,
      req.files
    );

    return UtilFunctions.outputSuccess(res, group, "Group created successfully", 201);
  });

  /**
   * Get all groups in a community
   */
  static getCommunityGroups = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { communityId } = req.params;

    const result = await CommunityGroupService.getCommunityGroups(
      communityId,
      userId,
      req.query
    );

    return UtilFunctions.outputSuccess(res, result);
  });

  /**
   * Get group by ID
   */
  static getGroupById = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { groupId } = req.params;

    const group = await CommunityGroupService.getGroupById(groupId, userId);

    return UtilFunctions.outputSuccess(res, group);
  });

  /**
   * Update group
   */
  static updateGroup = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { groupId } = req.params;

    const group = await CommunityGroupService.updateGroup(
      groupId,
      userId,
      req.body,
      req.files
    );

    return UtilFunctions.outputSuccess(res, group, "Group updated successfully");
  });

  /**
   * Delete group
   */
  static deleteGroup = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { groupId } = req.params;

    const result = await CommunityGroupService.deleteGroup(groupId, userId);

    return UtilFunctions.outputSuccess(res, result);
  });

  /**
   * Join group
   */
  static joinGroup = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { groupId } = req.params;

    const membership = await CommunityGroupService.joinGroup(groupId, userId);

    return UtilFunctions.outputSuccess(
      res,
      membership,
      "Successfully joined the group"
    );
  });

  /**
   * Leave group
   */
  static leaveGroup = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { groupId } = req.params;

    const result = await CommunityGroupService.leaveGroup(groupId, userId);

    return UtilFunctions.outputSuccess(res, result);
  });

  /**
   * Update group member role
   */
  static updateGroupMemberRole = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { groupId, memberId } = req.params;
    const { role } = req.body;

    const membership = await CommunityGroupService.updateGroupMemberRole(
      groupId,
      userId,
      memberId,
      role
    );

    return UtilFunctions.outputSuccess(
      res,
      membership,
      "Member role updated successfully"
    );
  });

  /**
   * Remove member from group
   */
  static removeGroupMember = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { groupId, memberId } = req.params;

    const result = await CommunityGroupService.removeGroupMember(
      groupId,
      userId,
      memberId
    );

    return UtilFunctions.outputSuccess(res, result);
  });

  /**
   * Get group messages
   */
  static getGroupMessages = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { groupId } = req.params;

    const result = await CommunityGroupService.getGroupMessages(
      groupId,
      userId,
      req.query
    );

    return UtilFunctions.outputSuccess(res, result);
  });

  /**
   * Send message to group
   */
  static sendMessage = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { groupId } = req.params;

    const message = await CommunityGroupService.sendMessage(
      groupId,
      userId,
      req.body
    );

    return UtilFunctions.outputSuccess(res, message, "Message sent successfully", 201);
  });

  /**
   * Delete message
   */
  static deleteMessage = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;
    const { messageId } = req.params;

    const result = await CommunityGroupService.deleteMessage(messageId, userId);

    return UtilFunctions.outputSuccess(res, result);
  });
}

export default CommunityGroupController;
