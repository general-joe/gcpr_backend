import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import UploadService from "../../utils/uploadService.js";
import constants from "../../utils/constants.js";
import { getIO } from "../../socket.io.js";

class CommunityGroupService {
  /**
   * Create a new group in community
   */
  static async createGroup(communityId, userId, groupData, files) {
    // Check if user is a member
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });

    if (!membership || membership.status !== "ACTIVE") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You must be a member to create groups"
      );
    }

    const { name, description, isAnnouncementOnly } = groupData;

    // Handle group image upload
    let imageUrl = null;
    if (files?.image) {
      const fileName = `group_${UtilFunctions.genId()}.jpg`;
      imageUrl = await UploadService.saveFile(
        files.image[0].buffer,
        fileName,
        constants.PROFILE_BUCKET
      );
    }

    const group = await prisma.communityGroup.create({
      data: {
        communityId,
        name,
        description,
        image: imageUrl,
        createdBy: userId,
        isAnnouncementOnly:
          isAnnouncementOnly === "true" || isAnnouncementOnly === true,
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    // Add creator as admin
    await prisma.communityGroupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: "ADMIN",
      },
    });

    return group;
  }

  /**
   * Get all groups in a community
   */
  static async getCommunityGroups(communityId, userId, query) {
    const { limit, offset, page } = UtilFunctions.getLimitOffset(query);

    // Check if user is a member
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });

    if (!membership || membership.status !== "ACTIVE") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You must be a member to view groups"
      );
    }

    const [groups, total] = await Promise.all([
      prisma.communityGroup.findMany({
        where: { communityId },
        include: {
          _count: {
            select: { members: true, messages: true },
          },
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        skip: offset,
        take: limit,
      }),
      prisma.communityGroup.count({
        where: { communityId },
      }),
    ]);

    // Check which groups user is a member of
    const userGroupMemberships = await prisma.communityGroupMember.findMany({
      where: {
        userId,
        group: { communityId },
      },
      select: { groupId: true },
    });

    const userGroupIds = new Set(userGroupMemberships.map((m) => m.groupId));

    const groupsWithMembership = groups.map((group) => ({
      ...group,
      isMember: userGroupIds.has(group.id),
    }));

    return {
      data: groupsWithMembership,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get group by ID
   */
  static async getGroupById(groupId, userId) {
    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                profileImage: true,
              },
            },
          },
          orderBy: { joinedAt: "desc" },
        },
        _count: {
          select: { members: true, messages: true },
        },
      },
    });

    if (!group) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Group not found");
    }

    // Check if user is a member of the community
    const communityMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: group.communityId,
          userId,
        },
      },
    });

    if (!communityMembership || communityMembership.status !== "ACTIVE") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You must be a community member to view this group"
      );
    }

    // Check if user is a member of the group
    const groupMembership = await prisma.communityGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    return {
      ...group,
      isMember: !!groupMembership,
      memberRole: groupMembership?.role || null,
    };
  }

  /**
   * Update group
   */
  static async updateGroup(groupId, userId, updateData, files) {
    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Group not found");
    }

    // Check if user is group admin or community admin/owner
    const groupMembership = await prisma.communityGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    const communityMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: group.communityId,
          userId,
        },
      },
    });

    const isGroupAdmin = groupMembership?.role === "ADMIN";
    const isCommunityAdmin = ["OWNER", "ADMIN"].includes(
      communityMembership?.role
    );

    if (!isGroupAdmin && !isCommunityAdmin) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You don't have permission to update this group"
      );
    }

    const { name, description, isAnnouncementOnly } = updateData;

    // Handle image upload
    let imageUrl = undefined;
    if (files?.image) {
      const fileName = `group_${UtilFunctions.genId()}.jpg`;
      imageUrl = await UploadService.saveFile(
        files.image[0].buffer,
        fileName,
        constants.PROFILE_BUCKET
      );
    }

    const updatedGroup = await prisma.communityGroup.update({
      where: { id: groupId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isAnnouncementOnly !== undefined && {
          isAnnouncementOnly:
            isAnnouncementOnly === "true" || isAnnouncementOnly === true,
        }),
        ...(imageUrl && { image: imageUrl }),
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return updatedGroup;
  }

  /**
   * Delete group
   */
  static async deleteGroup(groupId, userId) {
    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Group not found");
    }

    if (group.isDefault) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "Cannot delete the default group"
      );
    }

    // Check if user is group creator or community admin/owner
    const communityMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: group.communityId,
          userId,
        },
      },
    });

    const isCreator = group.createdBy === userId;
    const isCommunityAdmin = ["OWNER", "ADMIN"].includes(
      communityMembership?.role
    );

    if (!isCreator && !isCommunityAdmin) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You don't have permission to delete this group"
      );
    }

    await prisma.communityGroup.delete({
      where: { id: groupId },
    });

    return { message: "Group deleted successfully" };
  }

  /**
   * Join group
   */
  static async joinGroup(groupId, userId) {
    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Group not found");
    }

    // Check if user is a community member
    const communityMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: group.communityId,
          userId,
        },
      },
    });

    if (!communityMembership || communityMembership.status !== "ACTIVE") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You must be a community member to join groups"
      );
    }

    // Check if already a member
    const existingMembership = await prisma.communityGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (existingMembership) {
      throw new gcprError(HttpStatus.CONFLICT, "You are already a member of this group");
    }

    const membership = await prisma.communityGroupMember.create({
      data: {
        groupId,
        userId,
        role: "MEMBER",
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
      },
    });

    return membership;
  }

  /**
   * Leave group
   */
  static async leaveGroup(groupId, userId) {
    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Group not found");
    }

    if (group.isDefault) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "Cannot leave the default group"
      );
    }

    const membership = await prisma.communityGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "You are not a member of this group"
      );
    }

    await prisma.communityGroupMember.delete({
      where: { id: membership.id },
    });

    return { message: "Successfully left the group" };
  }

  /**
   * Update group member role
   */
  static async updateGroupMemberRole(groupId, userId, targetUserId, newRole) {
    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Group not found");
    }

    // Check if user has permission
    const membership = await prisma.communityGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    const communityMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: group.communityId,
          userId,
        },
      },
    });

    const isGroupAdmin = membership?.role === "ADMIN";
    const isCommunityAdmin = ["OWNER", "ADMIN"].includes(
      communityMembership?.role
    );

    if (!isGroupAdmin && !isCommunityAdmin) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You don't have permission to update member roles"
      );
    }

    // Check target membership
    const targetMembership = await prisma.communityGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      throw new gcprError(HttpStatus.NOT_FOUND, "User is not a member of this group");
    }

    const updatedMembership = await prisma.communityGroupMember.update({
      where: { id: targetMembership.id },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
      },
    });

    return updatedMembership;
  }

  /**
   * Remove member from group
   */
  static async removeGroupMember(groupId, userId, targetUserId) {
    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Group not found");
    }

    // Check if user has permission
    const membership = await prisma.communityGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    const communityMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: group.communityId,
          userId,
        },
      },
    });

    const isGroupAdmin = membership?.role === "ADMIN";
    const isCommunityAdmin = ["OWNER", "ADMIN"].includes(
      communityMembership?.role
    );

    if (!isGroupAdmin && !isCommunityAdmin) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You don't have permission to remove members"
      );
    }

    // Check target membership
    const targetMembership = await prisma.communityGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      throw new gcprError(HttpStatus.NOT_FOUND, "User is not a member of this group");
    }

    await prisma.communityGroupMember.delete({
      where: { id: targetMembership.id },
    });

    return { message: "Member removed from group successfully" };
  }

  /**
   * Get group messages
   */
  static async getGroupMessages(groupId, userId, query) {
    const { limit, offset, page } = UtilFunctions.getLimitOffset(query);

    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Group not found");
    }

    // Check if user is a member
    const membership = await prisma.communityGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You must be a group member to view messages"
      );
    }

    const [messages, total] = await Promise.all([
      prisma.communityMessage.findMany({
        where: { groupId },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              sender: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.communityMessage.count({
        where: { groupId },
      }),
    ]);

    return {
      data: messages.reverse(),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Send message to group
   */
  static async sendMessage(groupId, userId, messageData) {
    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Group not found");
    }

    // Check if user is a member
    const membership = await prisma.communityGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You must be a group member to send messages"
      );
    }

    // Check if announcement only and user is not admin
    if (group.isAnnouncementOnly && membership.role !== "ADMIN") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Only admins can send messages in this group"
      );
    }

    const { content, type, mediaUrl, metadata, replyToId, caption } = messageData;

    const message = await prisma.communityMessage.create({
      data: {
        groupId,
        senderId: userId,
        content,
        type: type || "TEXT",
        mediaUrl,
        caption,
        metadata,
        replyToId,
        status: "SENT",
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    // Emit real-time event to group members
    const io = getIO();
    if (io) {
      io.to(`community-group-${groupId}`).emit('new-community-message', message);
    }

    return message;
  }

  /**
   * Delete message
   */
  static async deleteMessage(messageId, userId) {
    const message = await prisma.communityMessage.findUnique({
      where: { id: messageId },
      include: {
        group: true,
      },
    });

    if (!message) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Message not found");
    }

    // Check if user is sender or group admin
    const isSender = message.senderId === userId;

    const groupMembership = await prisma.communityGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: message.groupId,
          userId,
        },
      },
    });

    const communityMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: message.group.communityId,
          userId,
        },
      },
    });

    const isGroupAdmin = groupMembership?.role === "ADMIN";
    const isCommunityAdmin = ["OWNER", "ADMIN"].includes(
      communityMembership?.role
    );

    if (!isSender && !isGroupAdmin && !isCommunityAdmin) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You don't have permission to delete this message"
      );
    }

    await prisma.communityMessage.delete({
      where: { id: messageId },
    });

    // Emit real-time event to group members
    const io = getIO();
    if (io) {
      io.to(`community-group-${message.groupId}`).emit('community-message-deleted', {
        messageId,
        groupId: message.groupId,
      });
    }

    return { message: "Message deleted successfully" };
  }
}

export default CommunityGroupService;
