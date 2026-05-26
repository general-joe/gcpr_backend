import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import NotificationService from "../notification/notification.service.js";
import {
  createMeetRoom,
  updateMeetRoom,
  cancelMeetRoom,
  computeCountdown
} from "./google-meet.service.js";

class TelehealthService {
  static async requireServiceProvider(userId, userType) {
    const sp = await prisma.serviceProvider.findUnique({
      where: { userId },
      select: { id: true, userId: true }
    });
    if (!sp) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { userType: true }
      });
      if (user?.userType === 'ADMIN') {
        return { id: userId, userId: null, isAdmin: true };
      }
      const userRoles = await prisma.userRole.findMany({
        where: { userId, active: true },
        select: { role: { select: { slug: true } } }
      });
      const hasAdminRole = userRoles.some(ur => ur.role.slug === 'admin');
      if (hasAdminRole) {
        return { id: userId, userId: null, isAdmin: true };
      }
      throw new gcprError(HttpStatus.NOT_FOUND, "Service provider profile not found");
    }
    return { ...sp, isAdmin: false };
  }

  static buildReminders(scheduledStart) {
    const start = new Date(scheduledStart).getTime();
    return [
      { at: new Date(start - 60 * 60 * 1000).toISOString(), sent: false, type: "1_HOUR" },
      { at: new Date(start - 15 * 60 * 1000).toISOString(), sent: false, type: "15_MIN" }
    ];
  }

  static async createRoom(user, data) {
    const sp = await TelehealthService.requireServiceProvider(user.id, user.userType);

    // Get attendee emails from patient userIds (optional)
    const patientUsers = [];
    if (data.patientIds && data.patientIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: data.patientIds } },
        select: { id: true, email: true, fullName: true }
      });
      patientUsers.push(...users);
    }

    // Creator's email
    const creatorUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true }
    });

    const attendeeEmails = [];
    if (creatorUser?.email) attendeeEmails.push(creatorUser.email);
    for (const u of patientUsers) {
      if (u.email) attendeeEmails.push(u.email);
    }

    // Create Google Meet room
    let meetData = { externalMeetingId: null, joinUrl: null, providerPayload: {} };
    try {
      meetData = await createMeetRoom({
        title: data.title,
        description: data.description,
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        attendeeEmails
      });
    } catch (e) {
      WRITE.error("[Telehealth] Google Meet creation failed", { error: e.message, stack: e.stack });
      throw new gcprError(
        HttpStatus.BAD_GATEWAY,
        `Unable to provision Google Meet: ${e.message}`,
      );
    }

    const reminders = TelehealthService.buildReminders(data.scheduledStart);

    const isServiceProvider = !sp.isAdmin;
    const providerId = isServiceProvider ? sp.id : null;
    
    const room = await prisma.telehealthRoom.create({
      data: {
        organizationId: isServiceProvider ? sp.id : user.id,
        creatorUserId: user.id,
        providedByProviderId: providerId,
        title: data.title,
        description: data.description,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        visibility: data.visibility || "private",
        maxParticipants: data.maxParticipants || 50,
        externalMeetingId: meetData.externalMeetingId,
        joinUrl: meetData.joinUrl,
        providerPayload: meetData.providerPayload,
        metadata: { reminders }
      }
    });

    // Add creator as provider participant
    await prisma.telehealthParticipant.create({
      data: {
        roomId: room.id,
        userId: user.id,
        role: "provider",
        status: "accepted"
      }
    });

    // Invite patients/users
    if (data.patientIds && data.patientIds.length > 0) {
      await TelehealthService.inviteUsers(user, room, data.patientIds, meetData.joinUrl);
    }

    return room;
  }

  static async inviteUsers(inviterUser, room, userIds, joinUrl) {
    const uniqueIds = [...new Set(userIds)].filter(id => id !== inviterUser.id);

    for (const userId of uniqueIds) {
      // Upsert participant record
      try {
        await prisma.telehealthParticipant.upsert({
          where: { roomId_userId: { roomId: room.id, userId } },
          create: { roomId: room.id, userId, role: "caregiver", status: "invited" },
          update: { status: "invited" }
        });
      } catch (e) {
        WRITE.warn("[Telehealth] Participant upsert failed", { userId, error: e.message });
      }

      // Send notification
      try {
        await NotificationService.createNotification({
          userId,
          type: "IN_APP",
          category: "APPOINTMENT_REMINDER",
          title: "Telehealth Room Invitation",
          content: `You have been invited to a telehealth session: "${room.title || "Consultation"}". Join URL: ${joinUrl || "See app for details"}`,
          relatedId: room.id,
          relatedModel: "TelehealthRoom",
          data: { joinUrl, roomId: room.id, scheduledStart: room.scheduledStart },
          expiresAt: room.scheduledEnd ? new Date(new Date(room.scheduledEnd).getTime() + 24 * 60 * 60 * 1000) : null
        });
      } catch (e) {
        WRITE.warn("[Telehealth] Notification failed", { userId, error: e.message });
      }
    }
  }

  static async listRooms(user, query = {}) {
    const { filter = "upcoming", page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const now = new Date();

    let where = {};

    if (user.userType === "ADMIN") {
      where = {};
    } else if (user.userType === "SERVICE_PROVIDER") {
      where = {
        OR: [
          { creatorUserId: user.id },
          { participants: { some: { userId: user.id } } }
        ]
      };
    } else {
      where = { participants: { some: { userId: user.id } } };
    }

    if (filter === "upcoming") {
      where.scheduledStart = { gte: now };
      where.status = { in: ["scheduled", "live"] };
    } else if (filter === "past") {
      where.OR = [
        { scheduledStart: { lt: now } },
        { status: { in: ["completed", "canceled"] } }
      ];
    }

    const [rooms, total] = await Promise.all([
      prisma.telehealthRoom.findMany({
        where,
        skip,
        take,
        orderBy: { scheduledStart: "asc" },
        include: {
          participants: { select: { id: true, userId: true, role: true, status: true } }
        }
      }),
      prisma.telehealthRoom.count({ where })
    ]);

    return {
      data: rooms,
      pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) }
    };
  }

  static async getRoomById(user, roomId) {
    const room = await prisma.telehealthRoom.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          select: { id: true, userId: true, role: true, status: true, joinedAt: true }
        }
      }
    });

    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");

    // Check access
    const isParticipant = room.participants.some(p => p.userId === user.id);
    const isCreator = room.creatorUserId === user.id;
    if (!isParticipant && !isCreator) {
      throw new gcprError(HttpStatus.FORBIDDEN, "You do not have access to this room");
    }

    const countdown = room.scheduledStart ? computeCountdown(room.scheduledStart) : null;

    return { ...room, countdown };
  }

  static async updateRoom(user, roomId, data) {
    const room = await prisma.telehealthRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");
    if (room.creatorUserId !== user.id) throw new gcprError(HttpStatus.FORBIDDEN, "Only the creator can update this room");

    // Update Google Calendar event if external meeting exists
    if (room.externalMeetingId) {
      try {
        await updateMeetRoom(room.externalMeetingId, data);
      } catch (e) {
        WRITE.warn("[Telehealth] Google Calendar update failed", { error: e.message });
      }
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.scheduledStart) {
      updateData.scheduledStart = new Date(data.scheduledStart);
      // Rebuild reminders
      const reminders = TelehealthService.buildReminders(data.scheduledStart);
      updateData.metadata = { ...(room.metadata || {}), reminders };
    }
    if (data.scheduledEnd) updateData.scheduledEnd = new Date(data.scheduledEnd);

    return prisma.telehealthRoom.update({ where: { id: roomId }, data: updateData });
  }

  static async cancelRoom(user, roomId) {
    const room = await prisma.telehealthRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");
    if (room.creatorUserId !== user.id) throw new gcprError(HttpStatus.FORBIDDEN, "Only the creator can cancel this room");

    if (room.externalMeetingId) {
      try {
        await cancelMeetRoom(room.externalMeetingId);
      } catch (e) {
        WRITE.warn("[Telehealth] Google Calendar delete failed", { error: e.message });
      }
    }

    return prisma.telehealthRoom.update({
      where: { id: roomId },
      data: { status: "canceled", canceledAt: new Date(), canceledBy: user.id }
    });
  }

  static async inviteToRoom(user, roomId, userIds) {
    const room = await prisma.telehealthRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");

    // Only SP can invite
    if (user.userType !== "SERVICE_PROVIDER") throw new gcprError(HttpStatus.FORBIDDEN, "Only service providers can invite users");

    await TelehealthService.inviteUsers(user, room, userIds, room.joinUrl);

    return { invited: userIds.length, roomId };
  }

  static async getParticipants(user, roomId) {
    const room = await prisma.telehealthRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");

    const participants = await prisma.telehealthParticipant.findMany({
      where: { roomId },
      include: {
        user: { select: { id: true, fullName: true, profileImage: true, role: true } }
      }
    });

    return { total: participants.length, participants };
  }

  static async joinRoom(user, roomId) {
    const room = await prisma.telehealthRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");
    if (room.status === "canceled") throw new gcprError(HttpStatus.BAD_REQUEST, "This room has been canceled");

    // Upsert participant as joined
    await prisma.telehealthParticipant.upsert({
      where: { roomId_userId: { roomId, userId: user.id } },
      create: { roomId, userId: user.id, role: user.userType === "SERVICE_PROVIDER" ? "provider" : "caregiver", status: "joined", joinedAt: new Date() },
      update: { status: "joined", joinedAt: new Date() }
    });

    return { joinUrl: room.joinUrl, room };
  }

  static async getCountdown(user, roomId) {
    const room = await prisma.telehealthRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");

    const isParticipant = await prisma.telehealthParticipant.findFirst({
      where: { roomId, userId: user.id }
    });
    if (!isParticipant && room.creatorUserId !== user.id) {
      throw new gcprError(HttpStatus.FORBIDDEN, "Access denied");
    }

    const countdown = room.scheduledStart ? computeCountdown(room.scheduledStart) : null;

    return {
      room: { id: room.id, title: room.title, scheduledStart: room.scheduledStart, status: room.status },
      joinUrl: room.joinUrl,
      countdown
    };
  }

  static async updateRoomStatus(user, roomId, status) {
    if (user.userType !== "SERVICE_PROVIDER") throw new gcprError(HttpStatus.FORBIDDEN, "Only service providers can update room status");
    const room = await prisma.telehealthRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");

    return prisma.telehealthRoom.update({ where: { id: roomId }, data: { status } });
  }
}

export default TelehealthService;
