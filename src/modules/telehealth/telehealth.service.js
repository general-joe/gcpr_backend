import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import NotificationService from "../notification/notification.service.js";
import { sendPushNotification, sendMulticastPushNotification } from "../../utils/firebaseService.js";
import { SendSMS } from "../../utils/hubtel-sms.js";
import WRITE from "../../utils/logger.js";
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
    if (!scheduledStart) return [];

    const start = new Date(scheduledStart).getTime();
    if (!Number.isFinite(start)) return [];

    return [
      { at: new Date(start - 60 * 60 * 1000).toISOString(), sent: false, type: "1_HOUR" },
      { at: new Date(start - 15 * 60 * 1000).toISOString(), sent: false, type: "15_MIN" }
    ];
  }

  static async normalizeAttendees(attendees = []) {
    const byId = new Map();
    const byEmail = new Map();
    const byPhone = new Map();

    if (!Array.isArray(attendees)) return [];

    for (const raw of attendees) {
      const userId = typeof raw?.userId === 'string' ? raw.userId.trim() : null;
      const email = typeof raw?.email === 'string' ? raw.email.trim().toLowerCase() : null;
      const phone = typeof raw?.phone === 'string' ? raw.phone.trim() : null;
      if (!userId && !email && !phone) continue;

      if (userId) byId.set(userId, { userId, email, phone });
      else if (email) byEmail.set(email, { userId: null, email, phone });
      else if (phone) byPhone.set(phone, { userId: null, email: null, phone });
    }

    const result = [...byId.values(), ...byEmail.values(), ...byPhone.values()];
    if (result.length === 0) return [];

    const ids = result.filter(r => r.userId).map(r => r.userId);
    const emails = result.filter(r => r.email).map(r => r.email);
    const phones = result.filter(r => r.phone).map(r => r.phone);
    const orConditions = [];
    if (ids.length) orConditions.push({ id: { in: ids } });
    if (emails.length) orConditions.push({ email: { in: emails } });
    if (phones.length) orConditions.push({ phoneNumber: { in: phones } });

    if (!orConditions.length) return [];

    const matchedUsers = await prisma.user.findMany({
      where: { OR: orConditions },
      select: { id: true, email: true, phoneNumber: true, fullName: true }
    });

    const deduped = [];
    const seen = new Set();
    for (const u of matchedUsers) {
      const key = u.id || u.email || u.phoneNumber;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      deduped.push({
        userId: u.id,
        email: u.email,
        phone: u.phoneNumber,
        fullName: u.fullName,
      });
    }

    for (const r of result) {
      if (r.userId && !seen.has(r.userId)) {
        seen.add(r.userId);
        deduped.push({ userId: r.userId, email: r.email, phone: r.phone });
      }
    }

    return deduped;
  }

  static async createRoom(user, data) {
    const sp = await TelehealthService.requireServiceProvider(user.id, user.userType);

    const resolvedAttendees = await TelehealthService.normalizeAttendees(data.attendees);

    const attendeeEmails = [];
    const creatorUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true }
    });
    if (creatorUser?.email) attendeeEmails.push(creatorUser.email);
    for (const a of resolvedAttendees) {
      if (a.email && !attendeeEmails.includes(a.email)) attendeeEmails.push(a.email);
    }

    const reminders = TelehealthService.buildReminders(data.scheduledStart);
    const isServiceProvider = !sp.isAdmin;
    const providerId = isServiceProvider ? sp.id : (data.providerId || null);

    const room = await prisma.telehealthRoom.create({
      data: {
        organizationId: isServiceProvider ? sp.id : user.id,
        creatorUserId: user.id,
        providedByProviderId: providerId,
        title: data.title,
        description: data.description,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : null,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : null,
        visibility: data.visibility || "private",
        maxParticipants: data.maxParticipants || 50,
        metadata: { reminders, providerError: null }
      }
    });

    await prisma.telehealthParticipant.create({
      data: {
        roomId: room.id,
        userId: user.id,
        role: "provider",
        status: "accepted"
      }
    });

    let joinUrl = null;
    let providerError = null;

    try {
      const meetData = await createMeetRoom({
        title: data.title,
        description: data.description,
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        attendeeEmails
      });

      await prisma.telehealthRoom.update({
        where: { id: room.id },
        data: {
          externalMeetingId: meetData.externalMeetingId,
          joinUrl: meetData.joinUrl,
          providerPayload: meetData.providerPayload,
          metadata: { ...room.metadata, reminders, providerError: null }
        }
      });
      joinUrl = meetData.joinUrl;
    } catch (e) {
      providerError = e?.message || "Unable to provision Google Meet";
      WRITE.error("[Telehealth] Google Meet creation failed", { error: providerError, stack: e?.stack });
      await prisma.telehealthRoom.update({
        where: { id: room.id },
        data: {
          metadata: { ...room.metadata, reminders, providerError }
        }
      });
    }

    if (resolvedAttendees.length > 0 && joinUrl) {
      await TelehealthService.inviteUsers(user, room, resolvedAttendees, joinUrl);
    }

    return prisma.telehealthRoom.findUnique({
      where: { id: room.id },
      include: {
        participants: {
          include: { user: { select: { id: true, fullName: true, profileImage: true, role: true } } },
        }
      }
    });
  }

  static async inviteUsers(inviterUser, room, attendees, joinUrl) {
    const uniqueAttendees = [];
    const seen = new Set();
    for (const a of attendees) {
      const key = a.userId || a.email || a.phone;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      uniqueAttendees.push(a);
    }

    for (const attendee of uniqueAttendees) {
      const userId = attendee.userId;
      const email = attendee.email;
      const phone = attendee.phone;
      const fullName = attendee.fullName;

      if (userId && !email && !phone) {
        const fresh = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, phoneNumber: true, fullName: true }
        });
        if (fresh) {
          attendee.email = fresh.email;
          attendee.phone = fresh.phoneNumber;
          attendee.fullName = fresh.fullName;
        }
      }

      const userForParticipant = userId ? { id: userId } : null;
      const resolvedUserId = userId;

      if (resolvedUserId) {
        try {
          await prisma.telehealthParticipant.upsert({
            where: { roomId_userId: { roomId: room.id, userId: resolvedUserId } },
            create: { roomId: room.id, userId: resolvedUserId, role: "caregiver", status: "invited" },
            update: { status: "invited" }
          });
        } catch (e) {
          WRITE.warn("[Telehealth] Participant upsert failed", { resolvedUserId, error: e.message });
        }
      }

      try {
        await prisma.telehealthInvitation.create({
          data: {
            roomId: room.id,
            inviterUserId: inviterUser.id,
            inviteeUserId: resolvedUserId,
            inviteeEmail: email,
            inviteePhone: phone,
            status: "sent"
          }
        });
      } catch (e) {
        WRITE.warn("[Telehealth] Invitation record failed", { resolvedUserId, email, error: e.message });
      }

      const joinUrlForUser = joinUrl || "See app for details";
      const message = `You have been invited to a telehealth session: "${room.title || 'Consultation'}". Join URL: ${joinUrlForUser}`;

      if (resolvedUserId) {
        try {
          await NotificationService.createNotification({
            userId: resolvedUserId,
            type: "IN_APP",
            category: "APPOINTMENT_REMINDER",
            title: "Telehealth Room Invitation",
            content: message,
            relatedId: room.id,
            relatedModel: "TelehealthRoom",
            data: { joinUrl: joinUrl, roomId: room.id, scheduledStart: room.scheduledStart },
            expiresAt: room.scheduledEnd ? new Date(new Date(room.scheduledEnd).getTime() + 24 * 60 * 60 * 1000) : null
          });
        } catch (e) {
          WRITE.warn("[Telehealth] In-app notification failed", { resolvedUserId, error: e.message });
        }

        try {
          const tokens = await prisma.pushNotificationToken.findMany({
            where: { userId: resolvedUserId, isActive: true },
            select: { token: true }
          });
          if (tokens.length > 0) {
            await sendMulticastPushNotification(
              tokens.map(t => t.token),
              {
                title: "Telehealth Invitation",
                body: message,
                data: { roomId: room.id, joinUrl: joinUrl || '', type: 'telehealth_invite' }
              }
            );
          }
        } catch (e) {
          WRITE.warn("[Telehealth] Push notification failed", { resolvedUserId, error: e.message });
        }
      }

      if (phone && (!resolvedUserId || !email)) {
        try {
          await SendSMS(
            phone,
            `Telehealth invitation: ${message}`
          );
        } catch (e) {
          WRITE.warn("[Telehealth] SMS invite failed", { phone, error: e.message });
        }
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
      where.status = { in: ["scheduled", "live", "rescheduled"] };
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

  static async inviteToRoom(user, roomId, attendees) {
    const room = await prisma.telehealthRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");

    // Only SP can invite
    if (user.userType !== "SERVICE_PROVIDER") throw new gcprError(HttpStatus.FORBIDDEN, "Only service providers can invite users");

    const resolved = await TelehealthService.normalizeAttendees(attendees);
    if (resolved.length === 0) throw new gcprError(HttpStatus.BAD_REQUEST, "No valid attendees provided");

    const joinUrl = room.joinUrl;
    await TelehealthService.inviteUsers(user, room, resolved, joinUrl);

    const invitedUserIds = resolved.map(a => a.userId).filter(Boolean);
    return { invited: invitedUserIds.length, roomId };
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

  static VALID_STATUS_TRANSITIONS = {
    scheduled: ["live", "canceled", "rescheduled"],
    live: ["completed", "canceled"],
    completed: ["rescheduled"],
    canceled: ["scheduled", "rescheduled"],
    rescheduled: ["scheduled", "live", "canceled"]
  };

  static ensureValidTransition(currentStatus, newStatus) {
    if (currentStatus === newStatus) return;
    const allowed = TelehealthService.VALID_STATUS_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        `Invalid status transition from '${currentStatus}' to '${newStatus}'`
      );
    }
  }

  static async updateRoomStatus(user, roomId, status) {
    if (user.userType !== "SERVICE_PROVIDER") throw new gcprError(HttpStatus.FORBIDDEN, "Only service providers can update room status");
    const room = await prisma.telehealthRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");

    TelehealthService.ensureValidTransition(room.status, status);

    return prisma.telehealthRoom.update({ where: { id: roomId }, data: { status } });
  }
}

export default TelehealthService;
