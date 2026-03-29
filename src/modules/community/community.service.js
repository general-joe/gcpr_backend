import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import UploadService from "../../utils/uploadService.js";
import constants from "../../utils/constants.js";

class CommunityService {
  /**
   * Create a new community
   */
  static async createCommunity(userId, communityData, files) {
    const { name, description, isPublic, maxMembers } = communityData;

    // Handle community image upload
    let imageUrl = null;
    if (files?.image) {
      const fileName = `community_${UtilFunctions.genId()}.jpg`;
      imageUrl = await UploadService.saveFile(
        files.image[0].buffer,
        fileName,
        constants.PROFILE_BUCKET
      );
    }

    // Generate unique invite code
    const inviteCode = UtilFunctions.genId(8);

    const community = await prisma.community.create({
      data: {
        name,
        description,
        image: imageUrl,
        createdBy: userId,
        inviteCode,
        isPublic: isPublic === "true" || isPublic === true,
        maxMembers: parseInt(maxMembers) || 1000,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
      },
    });

    // Add creator as owner
    await prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId,
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    // Create default general group
    await prisma.communityGroup.create({
      data: {
        communityId: community.id,
        name: "General",
        description: "General discussion group",
        createdBy: userId,
        isDefault: true,
      },
    });

    return community;
  }

  /**
   * Get community by ID
   */
  static async getCommunityById(communityId, userId) {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
        members: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                profileImage: true,
                phoneNumber: true,
              },
            },
          },
          orderBy: { joinedAt: "desc" },
        },
        groups: {
          where: { isDefault: true },
          take: 1,
        },
        _count: {
          select: {
            members: { where: { status: "ACTIVE" } },
            groups: true,
          },
        },
      },
    });

    if (!community) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Community not found");
    }

    // Check if user is a member
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });

    return {
      ...community,
      isMember: !!membership,
      memberRole: membership?.role || null,
    };
  }

  /**
   * Get all communities for a user
   */
  static async getUserCommunities(userId, query) {
    const { limit, offset, page } = UtilFunctions.getLimitOffset(query);

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where: {
          members: {
            some: {
              userId,
              status: "ACTIVE",
            },
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },
          _count: {
            select: {
              members: { where: { status: "ACTIVE" } },
              groups: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.community.count({
        where: {
          members: {
            some: {
              userId,
              status: "ACTIVE",
            },
          },
        },
      }),
    ]);

    return {
      data: communities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update community
   */
  static async updateCommunity(communityId, userId, updateData, files) {
    // Check if user is admin or owner
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You don't have permission to update this community"
      );
    }

    const { name, description, isPublic, maxMembers } = updateData;

    // Handle image upload
    let imageUrl = undefined;
    if (files?.image) {
      const fileName = `community_${UtilFunctions.genId()}.jpg`;
      imageUrl = await UploadService.saveFile(
        files.image[0].buffer,
        fileName,
        constants.PROFILE_BUCKET
      );
    }

    const community = await prisma.community.update({
      where: { id: communityId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && {
          isPublic: isPublic === "true" || isPublic === true,
        }),
        ...(maxMembers && { maxMembers: parseInt(maxMembers) }),
        ...(imageUrl && { image: imageUrl }),
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
      },
    });

    return community;
  }

  /**
   * Delete community
   */
  static async deleteCommunity(communityId, userId) {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Community not found");
    }

    if (community.createdBy !== userId) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Only the community creator can delete this community"
      );
    }

    await prisma.community.delete({
      where: { id: communityId },
    });

    return { message: "Community deleted successfully" };
  }

  /**
   * Join community using invite code
   */
  static async joinCommunityByInviteCode(userId, inviteCode) {
    const community = await prisma.community.findUnique({
      where: { inviteCode },
    });

    if (!community) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Invalid invite code");
    }

    if (!community.inviteEnabled) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "Invitations are disabled for this community"
      );
    }

    // Check if already a member
    const existingMember = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId,
        },
      },
    });

    if (existingMember) {
      if (existingMember.status === "ACTIVE") {
        throw new gcprError(
          HttpStatus.CONFLICT,
          "You are already a member of this community"
        );
      }
      if (existingMember.status === "BANNED") {
        throw new gcprError(
          HttpStatus.FORBIDDEN,
          "You have been banned from this community"
        );
      }
    }

    // Check member limit
    const memberCount = await prisma.communityMember.count({
      where: { communityId: community.id, status: "ACTIVE" },
    });

    if (memberCount >= community.maxMembers) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "Community has reached maximum member limit"
      );
    }

    // Add or update membership
    if (existingMember) {
      await prisma.communityMember.update({
        where: { id: existingMember.id },
        data: { status: "ACTIVE", joinedAt: new Date() },
      });
    } else {
      await prisma.communityMember.create({
        data: {
          communityId: community.id,
          userId,
          role: "MEMBER",
          status: "ACTIVE",
        },
      });
    }

    // Add to default group
    const defaultGroup = await prisma.communityGroup.findFirst({
      where: { communityId: community.id, isDefault: true },
    });

    if (defaultGroup) {
      await prisma.communityGroupMember.upsert({
        where: {
          groupId_userId: {
            groupId: defaultGroup.id,
            userId,
          },
        },
        create: {
          groupId: defaultGroup.id,
          userId,
          role: "MEMBER",
        },
        update: {},
      });
    }

    return { message: "Successfully joined the community", community };
  }

  /**
   * Leave community
   */
  static async leaveCommunity(communityId, userId) {
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
        HttpStatus.BAD_REQUEST,
        "You are not a member of this community"
      );
    }

    if (membership.role === "OWNER") {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "Owner cannot leave the community. Transfer ownership first or delete the community."
      );
    }

    // Update membership status
    await prisma.communityMember.update({
      where: { id: membership.id },
      data: { status: "LEFT" },
    });

    // Remove from all groups
    await prisma.communityGroupMember.deleteMany({
      where: {
        userId,
        group: { communityId },
      },
    });

    return { message: "Successfully left the community" };
  }

  /**
   * Update member role
   */
  static async updateMemberRole(communityId, userId, targetUserId, newRole) {
    // Check if user has permission
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You don't have permission to update member roles"
      );
    }

    // Check target membership
    const targetMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership || targetMembership.status !== "ACTIVE") {
      throw new gcprError(HttpStatus.NOT_FOUND, "User is not a member of this community");
    }

    // Only owner can assign admin role
    if (newRole === "ADMIN" && membership.role !== "OWNER") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Only the owner can assign admin role"
      );
    }

    // Prevent demoting owner
    if (targetMembership.role === "OWNER") {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "Cannot change the role of the community owner"
      );
    }

    const updatedMember = await prisma.communityMember.update({
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

    return updatedMember;
  }

  /**
   * Ban member from community
   */
  static async banMember(communityId, userId, targetUserId) {
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You don't have permission to ban members"
      );
    }

    const targetMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership || targetMembership.status !== "ACTIVE") {
      throw new gcprError(HttpStatus.NOT_FOUND, "User is not a member of this community");
    }

    // Prevent banning owner or other admins
    if (targetMembership.role === "OWNER") {
      throw new gcprError(HttpStatus.BAD_REQUEST, "Cannot ban the community owner");
    }

    if (targetMembership.role === "ADMIN" && membership.role !== "OWNER") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Only the owner can ban admins"
      );
    }

    await prisma.communityMember.update({
      where: { id: targetMembership.id },
      data: { status: "BANNED" },
    });

    // Remove from all groups
    await prisma.communityGroupMember.deleteMany({
      where: {
        userId: targetUserId,
        group: { communityId },
      },
    });

    return { message: "Member banned successfully" };
  }

  /**
   * Generate new invite code
   */
  static async generateInviteCode(communityId, userId) {
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You don't have permission to generate invite codes"
      );
    }

    const newInviteCode = UtilFunctions.genId(8);

    const community = await prisma.community.update({
      where: { id: communityId },
      data: { inviteCode: newInviteCode },
    });

    return { inviteCode: community.inviteCode };
  }

  /**
   * Search public communities
   */
  static async searchCommunities(query, searchTerm) {
    const { limit, offset, page } = UtilFunctions.getLimitOffset(query);

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where: {
          isPublic: true,
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },
          _count: {
            select: {
              members: { where: { status: "ACTIVE" } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.community.count({
        where: {
          isPublic: true,
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
      }),
    ]);

    return {
      data: communities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get community members
   */
  static async getCommunityMembers(communityId, userId, query) {
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
        "You must be a member to view community members"
      );
    }

    const [members, total] = await Promise.all([
      prisma.communityMember.findMany({
        where: { communityId, status: "ACTIVE" },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "desc" }],
        skip: offset,
        take: limit,
      }),
      prisma.communityMember.count({
        where: { communityId, status: "ACTIVE" },
      }),
    ]);

    return {
      data: members,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default CommunityService;
