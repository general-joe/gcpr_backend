import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import UploadService from "../../utils/uploadService.js";
import constants from "../../utils/constants.js";
import { getIO } from "../../socket.io.js";

class CommunityAnnouncementService {
  /**
   * Create a new announcement
   */
  static async createAnnouncement(communityId, userId, announcementData, files) {
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
        "Only admins can create announcements"
      );
    }

    const { title, content, isPinned } = announcementData;

    // Handle media upload
    let mediaUrl = null;
    if (files?.media) {
      const fileName = `announcement_${UtilFunctions.genId()}.jpg`;
      mediaUrl = await UploadService.saveFile(
        files.media[0].buffer,
        fileName,
        constants.PROFILE_BUCKET
      );
    }

    const announcement = await prisma.communityAnnouncement.create({
      data: {
        communityId,
        title,
        content,
        mediaUrl,
        createdBy: userId,
        isPinned: isPinned === "true" || isPinned === true,
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

    // Emit real-time event to community members
    const io = getIO();
    if (io) {
      io.to(`community-${communityId}`).emit('new-community-announcement', announcement);
    }

    return announcement;
  }

  /**
   * Get all announcements for a community
   */
  static async getCommunityAnnouncements(communityId, userId, query) {
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
        "You must be a member to view announcements"
      );
    }

    const [announcements, total] = await Promise.all([
      prisma.communityAnnouncement.findMany({
        where: { communityId },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip: offset,
        take: limit,
      }),
      prisma.communityAnnouncement.count({
        where: { communityId },
      }),
    ]);

    return {
      data: announcements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get announcement by ID
   */
  static async getAnnouncementById(announcementId, userId) {
    const announcement = await prisma.communityAnnouncement.findUnique({
      where: { id: announcementId },
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
      },
    });

    if (!announcement) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Announcement not found");
    }

    // Check if user is a member
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: announcement.communityId,
          userId,
        },
      },
    });

    if (!membership || membership.status !== "ACTIVE") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You must be a member to view this announcement"
      );
    }

    return announcement;
  }

  /**
   * Update announcement
   */
  static async updateAnnouncement(announcementId, userId, updateData, files) {
    const announcement = await prisma.communityAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Announcement not found");
    }

    // Check if user is admin or owner
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: announcement.communityId,
          userId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You don't have permission to update this announcement"
      );
    }

    const { title, content, isPinned } = updateData;

    // Handle media upload
    let mediaUrl = undefined;
    if (files?.media) {
      const fileName = `announcement_${UtilFunctions.genId()}.jpg`;
      mediaUrl = await UploadService.saveFile(
        files.media[0].buffer,
        fileName,
        constants.PROFILE_BUCKET
      );
    }

    const updatedAnnouncement = await prisma.communityAnnouncement.update({
      where: { id: announcementId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(isPinned !== undefined && {
          isPinned: isPinned === "true" || isPinned === true,
        }),
        ...(mediaUrl && { mediaUrl }),
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

    // Emit real-time event to community members
    const io = getIO();
    if (io) {
      io.to(`community-${announcement.communityId}`).emit('community-announcement-updated', updatedAnnouncement);
    }

    return updatedAnnouncement;
  }

  /**
   * Delete announcement
   */
  static async deleteAnnouncement(announcementId, userId) {
    const announcement = await prisma.communityAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Announcement not found");
    }

    // Check if user is admin or owner
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: announcement.communityId,
          userId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You don't have permission to delete this announcement"
      );
    }

    await prisma.communityAnnouncement.delete({
      where: { id: announcementId },
    });

    // Emit real-time event to community members
    const io = getIO();
    if (io) {
      io.to(`community-${announcement.communityId}`).emit('community-announcement-deleted', {
        announcementId,
        communityId: announcement.communityId,
      });
    }

    return { message: "Announcement deleted successfully" };
  }

  /**
   * Toggle pin announcement
   */
  static async togglePinAnnouncement(announcementId, userId) {
    const announcement = await prisma.communityAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Announcement not found");
    }

    // Check if user is admin or owner
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: announcement.communityId,
          userId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You don't have permission to pin/unpin announcements"
      );
    }

    const updatedAnnouncement = await prisma.communityAnnouncement.update({
      where: { id: announcementId },
      data: { isPinned: !announcement.isPinned },
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

    // Emit real-time event to community members
    const io = getIO();
    if (io) {
      io.to(`community-${announcement.communityId}`).emit('community-announcement-pinned', updatedAnnouncement);
    }

    return updatedAnnouncement;
  }
}

export default CommunityAnnouncementService;
