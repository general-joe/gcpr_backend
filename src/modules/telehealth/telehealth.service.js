import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import NotificationService from "../notification/notification.service.js";
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
      else if (phone) byPhone.set(phone, { userId: null, email, phone });
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

    let matchedUsers = [];
    try {
      matchedUsers = await prisma.user.findMany({
        where: { OR: orConditions },
        select: { id: true, email: true, phoneNumber: true, fullName: true }
      });
    } catch (e) {
      WRITE.error("[Telehealth] Failed to look up users for invite", {
        error: e.message,
        code: e.code,
        stack: e.stack
      });
      // Return empty array on database error - no valid attendees can be resolved
      return [];
    }

    // Build lookup maps for matched users - keyed by user ID
    const userById = new Map();
    for (const u of matchedUsers) {
      if (u.id) userById.set(u.id, u);
    }

    const deduped = [];
    const seenUserIds = new Set();

    // Process each original entry - ONLY include users that exist in the system
    for (const r of result) {
      const entryKey = r.userId || r.email || r.phone;
      if (!entryKey) continue;

      // Try to find matching user by any identifier
      let matchedUser = null;
      if (r.userId && userById.has(r.userId)) {
        matchedUser = userById.get(r.userId);
      } else {
        // Search through all matched users to find one matching email or phone
        for (const u of matchedUsers) {
          if (r.email && u.email && u.email.toLowerCase() === r.email) {
            matchedUser = u;
            break;
          }
          if (r.phone && u.phoneNumber && u.phoneNumber === r.phone) {
            matchedUser = u;
            break;
          }
        }
      }

      if (matchedUser) {
        // This is a registered user - deduplicate by userId
        if (!seenUserIds.has(matchedUser.id)) {
          seenUserIds.add(matchedUser.id);
          deduped.push({
            userId: matchedUser.id,
            email: matchedUser.email,
            phone: matchedUser.phoneNumber,
            fullName: matchedUser.fullName,
          });
        }
      }
      // If no matching user found, skip entirely - no external invitees
    }

    return deduped;
  }

  /**
   * Check if a notification already exists for the same user, category, and relatedId
   * to prevent duplicate notifications.
   */
  static async notificationExists(userId, category, relatedId) {
    if (!userId || !category || !relatedId) return false;
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        category,
        relatedId,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } // within last 5 minutes
      },
      select: { id: true }
    });
    return !!existing;
  }

  /**
   * Check if an invitation already exists for the same room and invitee.
   */
  static async invitationExists(roomId, inviteeUserId, inviteeEmail) {
    const where = { roomId };
    if (inviteeUserId) {
      where.inviteeUserId = inviteeUserId;
    } else if (inviteeEmail) {
      where.inviteeEmail = inviteeEmail;
    } else {
      return false;
    }
    const existing = await prisma.telehealthInvitation.findFirst({
      where,
      select: { id: true }
    });
    return !!existing;
  }

  /**
   * Check if a participant already exists for the same room and user.
   */
  static async participantExists(roomId, userId) {
    if (!userId) return false;
    const existing = await prisma.telehealthParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
      select: { id: true }
    });
    return !!existing;
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

    // Use a Prisma transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      WRITE.info("[Telehealth] Creating room", {
        userId: user.id,
        providerId,
        title: data.title,
        scheduledStart: data.scheduledStart,
        attendeeCount: resolvedAttendees.length
      });

      // 1. Create the room
      const room = await tx.telehealthRoom.create({
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

      WRITE.info("[Telehealth] Room created", { roomId: room.id });

      // 2. Create creator participant
      await tx.telehealthParticipant.create({
        data: {
          roomId: room.id,
          userId: user.id,
          role: "provider",
          status: "accepted"
        }
      });

      WRITE.info("[Telehealth] Creator participant created", {
        roomId: room.id,
        userId: user.id
      });

      // 3. Create Google Meet room (non-critical - failure won't rollback room)
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

        await tx.telehealthRoom.update({
          where: { id: room.id },
          data: {
            externalMeetingId: meetData.externalMeetingId,
            joinUrl: meetData.joinUrl,
            providerPayload: meetData.providerPayload,
            metadata: { reminders, providerError: null }
          }
        });
        joinUrl = meetData.joinUrl;

        WRITE.info("[Telehealth] Google Meet created", {
          roomId: room.id,
          externalMeetingId: meetData.externalMeetingId
        });
      } catch (e) {
        providerError = e?.message || "Unable to provision Google Meet";
        WRITE.error("[Telehealth] Google Meet creation failed", {
          roomId: room.id,
          error: providerError,
          stack: e?.stack
        });
        await tx.telehealthRoom.update({
          where: { id: room.id },
          data: {
            metadata: { reminders, providerError }
          }
        });
      }

      // 4. Invite users (non-critical - failure won't rollback room)
      if (resolvedAttendees.length > 0) {
        await TelehealthService.inviteUsersInTransaction(tx, user, room, resolvedAttendees, joinUrl);
      }

      // 5. Send creator a confirmation notification (always, even with no attendees)
      await TelehealthService.sendRoomCreatedNotification(user.id, room, joinUrl);

      // 6. Return the complete room
      return tx.telehealthRoom.findUnique({
        where: { id: room.id },
        include: {
          participants: {
            include: { user: { select: { id: true, fullName: true, profileImage: true } } },
          }
        }
      });
    });

    WRITE.info("[Telehealth] Room creation completed successfully", {
      roomId: result.id,
      participantCount: result.participants?.length
    });

    return result;
  }

  /**
   * Invite users within an existing transaction.
   * This ensures invitations, participants, and notifications are created atomically
   * and prevents duplicate records.
   */
  static async inviteUsersInTransaction(tx, inviterUser, room, attendees, joinUrl) {
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

      // Skip the room creator / inviter — they're already a participant
      if (userId && userId === inviterUser.id) {
        WRITE.info("[Telehealth] Skipping inviter from being invited", {
          roomId: room.id,
          userId
        });
        continue;
      }

      if (userId && !email && !phone) {
        const fresh = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, phoneNumber: true, fullName: true }
        });
        if (fresh) {
          attendee.email = fresh.email;
          attendee.phone = fresh.phoneNumber;
          attendee.fullName = fresh.fullName;
        }
      }

      const resolvedUserId = userId;

      // Create participant if not exists (idempotent)
      if (resolvedUserId) {
        const participantExists = await TelehealthService.participantExists(room.id, resolvedUserId);
        if (!participantExists) {
          try {
            await tx.telehealthParticipant.create({
              data: {
                roomId: room.id,
                userId: resolvedUserId,
                role: "caregiver",
                status: "invited"
              }
            });
            WRITE.info("[Telehealth] Participant created", {
              roomId: room.id,
              userId: resolvedUserId
            });
          } catch (e) {
            WRITE.error("[Telehealth] Participant creation failed", {
              roomId: room.id,
              userId: resolvedUserId,
              error: e.message,
              prismaCode: e.code,
              prismaMeta: e.meta,
              stack: e.stack
            });
            throw e; // Re-throw to trigger transaction rollback
          }
        } else {
          WRITE.info("[Telehealth] Participant already exists, skipping", {
            roomId: room.id,
            userId: resolvedUserId
          });
        }
      }

      // Create invitation if not exists (idempotent)
      const invExists = await TelehealthService.invitationExists(room.id, resolvedUserId, email);
      if (!invExists) {
        try {
          await tx.telehealthInvitation.create({
            data: {
              roomId: room.id,
              inviterUserId: inviterUser.id,
              inviteeUserId: resolvedUserId,
              inviteeEmail: email,
              inviteePhone: phone,
              status: "sent"
            }
          });
          WRITE.info("[Telehealth] Invitation created", {
            roomId: room.id,
            userId: resolvedUserId,
            email
          });
        } catch (e) {
          WRITE.error("[Telehealth] Invitation creation failed", {
            roomId: room.id,
            userId: resolvedUserId,
            email,
            error: e.message,
            prismaCode: e.code,
            prismaMeta: e.meta,
            stack: e.stack
          });
          throw e; // Re-throw to trigger transaction rollback
        }
      } else {
        WRITE.info("[Telehealth] Invitation already exists, skipping", {
          roomId: room.id,
          userId: resolvedUserId,
          email
        });
      }

      // Send notifications (outside transaction - non-critical)
      // Only send SMS to registered users (resolvedUserId exists).
      // External invitees (no user account) do not receive SMS.
      if (resolvedUserId) {
        await TelehealthService.sendInviteNotifications(
          resolvedUserId,
          room,
          joinUrl,
          email,
          phone
        );
      }
    }
  }

  /**
   * Send notifications for an invitation.
   * This is called outside the transaction to prevent notification failures
   * from rolling back the room creation.
   * Includes idempotency checks to prevent duplicate notifications.
   */
  static async sendInviteNotifications(userId, room, joinUrl, email, phone) {
    const joinUrlForUser = joinUrl || "See app for details";
    const message = `You have been invited to a telehealth session: "${room.title || 'Consultation'}". Join URL: ${joinUrlForUser}`;

    // Check if notification already exists (idempotency)
    const notifExists = await TelehealthService.notificationExists(
      userId,
      "APPOINTMENT_REMINDER",
      room.id
    );

    if (!notifExists) {
      try {
        await NotificationService.createNotification({
          userId,
          type: "IN_APP",
          category: "APPOINTMENT_REMINDER",
          title: "Telehealth Room Invitation",
          content: message,
          relatedId: room.id,
          relatedModel: "TelehealthRoom",
          data: { joinUrl: joinUrl, roomId: room.id, scheduledStart: room.scheduledStart },
          expiresAt: room.scheduledEnd
            ? new Date(new Date(room.scheduledEnd).getTime() + 24 * 60 * 60 * 1000)
            : null
        });
        WRITE.info("[Telehealth] In-app notification created", { userId, roomId: room.id });
      } catch (e) {
        WRITE.error("[Telehealth] In-app notification failed", {
          userId,
          roomId: room.id,
          error: e.message,
          stack: e.stack
        });
      }
    } else {
      WRITE.info("[Telehealth] Notification already exists, skipping", { userId, roomId: room.id });
    }

    // Send SMS only if a phone number was explicitly provided in the invite request.
    // We use the phone from the invite request, NOT from the user profile, to avoid
    // sending to the wrong number when the user has an outdated phone in their profile.
    if (phone) {
      try {
        await SendSMS(
          phone,
          `Telehealth invitation: ${message}`
        );
        WRITE.info("[Telehealth] SMS invite sent", { phone, roomId: room.id, userId });
      } catch (e) {
        WRITE.error("[Telehealth] SMS invite failed", {
          phone,
          roomId: room.id,
          userId,
          error: e.message,
          stack: e.stack
        });
      }
    }
  }

  /**
   * Send a confirmation notification to the room creator.
   * This ensures the creator always gets notified, even when there are no attendees.
   */
  static async sendRoomCreatedNotification(userId, room, joinUrl) {
    const joinUrlForUser = joinUrl || "See app for details";
    const message = `Your telehealth room "${room.title || 'Consultation'}" has been created. Join URL: ${joinUrlForUser}`;

    const notifExists = await TelehealthService.notificationExists(
      userId,
      "APPOINTMENT_REMINDER",
      room.id
    );

    if (!notifExists) {
      try {
        await NotificationService.createNotification({
          userId,
          type: "IN_APP",
          category: "APPOINTMENT_REMINDER",
          title: "Telehealth Room Created",
          content: message,
          relatedId: room.id,
          relatedModel: "TelehealthRoom",
          data: { joinUrl: joinUrl, roomId: room.id, scheduledStart: room.scheduledStart },
          expiresAt: room.scheduledEnd
            ? new Date(new Date(room.scheduledEnd).getTime() + 24 * 60 * 60 * 1000)
            : null
        });
        WRITE.info("[Telehealth] Room created notification sent", { userId, roomId: room.id });
      } catch (e) {
        WRITE.error("[Telehealth] Room created notification failed", {
          userId,
          roomId: room.id,
          error: e.message,
          stack: e.stack
        });
      }
    } else {
      WRITE.info("[Telehealth] Room created notification already exists, skipping", { userId, roomId: room.id });
    }
  }

  /**
   * Legacy inviteUsers method kept for backward compatibility.
   * New code should use inviteUsersInTransaction.
   */
  static async inviteUsers(inviterUser, room, attendees, joinUrl) {
    return TelehealthService.inviteUsersInTransaction(prisma, inviterUser, room, attendees, joinUrl);
  }

  static async listRooms(user, query = {}) {
    const { filter = "upcoming", page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const now = new Date();

    let where = {};

    // Exclude soft-deleted rooms
    where.deletedAt = null;

    if (user.userType === "ADMIN") {
      // Admins see all non-deleted rooms
    } else if (user.userType === "SERVICE_PROVIDER") {
      where = {
        ...where,
        OR: [
          { creatorUserId: user.id },
          { participants: { some: { userId: user.id } } }
        ]
      };
    } else {
      where = {
        ...where,
        participants: { some: { userId: user.id } }
      };
    }

    if (filter === "upcoming") {
      where.scheduledStart = { gte: now };
      where.status = { in: ["scheduled", "live", "rescheduled"] };
    } else if (filter === "past") {
      // Past means: (scheduledStart is in the past) OR (status is completed/canceled)
      // Must use AND to combine with user access filter correctly
      const pastOrConditions = [
        { scheduledStart: { lt: now } },
        { status: { in: ["completed", "canceled"] } }
      ];
      const pastFilter = { OR: pastOrConditions };
      if (where.OR) {
        // Wrap existing OR (user access) with past filter using AND
        where.AND = [
          { OR: where.OR },
          pastFilter
        ];
        delete where.OR;
      } else {
        where = { ...where, ...pastFilter };
      }
    }

    WRITE.info("[Telehealth] Listing rooms", {
      userId: user.id,
      userType: user.userType,
      filter,
      page,
      limit: take
    });

    const [rooms, total] = await Promise.all([
      prisma.telehealthRoom.findMany({
        where,
        skip,
        take,
        orderBy: { scheduledStart: "asc" },
        include: {
          participants: { select: { id: true, userId: true, status: true } }
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

    // Check if room is soft-deleted
    if (room.deletedAt) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");
    }

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

    WRITE.info("[Telehealth] Updating room", {
      roomId,
      userId: user.id,
      updates: Object.keys(data)
    });

    // Update Google Calendar event if external meeting exists
    if (room.externalMeetingId) {
      try {
        await updateMeetRoom(room.externalMeetingId, data);
        WRITE.info("[Telehealth] Google Calendar updated", { roomId, externalMeetingId: room.externalMeetingId });
      } catch (e) {
        WRITE.error("[Telehealth] Google Calendar update failed", {
          roomId,
          externalMeetingId: room.externalMeetingId,
          error: e.message,
          stack: e.stack
        });
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

    const updated = await prisma.telehealthRoom.update({ where: { id: roomId }, data: updateData });

    WRITE.info("[Telehealth] Room updated", { roomId });

    return updated;
  }

  static async cancelRoom(user, roomId) {
    const room = await prisma.telehealthRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");
    if (room.creatorUserId !== user.id) throw new gcprError(HttpStatus.FORBIDDEN, "Only the creator can cancel this room");

    WRITE.info("[Telehealth] Canceling room", { roomId, userId: user.id });

    if (room.externalMeetingId) {
      try {
        await cancelMeetRoom(room.externalMeetingId);
        WRITE.info("[Telehealth] Google Calendar event deleted", { roomId, externalMeetingId: room.externalMeetingId });
      } catch (e) {
        WRITE.error("[Telehealth] Google Calendar delete failed", {
          roomId,
          externalMeetingId: room.externalMeetingId,
          error: e.message,
          stack: e.stack
        });
      }
    }

    const updated = await prisma.telehealthRoom.update({
      where: { id: roomId },
      data: { status: "canceled", canceledAt: new Date(), canceledBy: user.id }
    });

    WRITE.info("[Telehealth] Room canceled", { roomId });

    return updated;
  }

  static async deleteRoom(user, roomId) {
    const room = await prisma.telehealthRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");
    if (room.creatorUserId !== user.id) throw new gcprError(HttpStatus.FORBIDDEN, "Only the creator can delete this room");

    WRITE.info("[Telehealth] Soft-deleting room", { roomId, userId: user.id });

    // Soft delete by setting deletedAt
    const updated = await prisma.telehealthRoom.update({
      where: { id: roomId },
      data: { deletedAt: new Date() }
    });

    WRITE.info("[Telehealth] Room soft-deleted", { roomId });

    return updated;
  }

  static async inviteToRoom(user, roomId, attendees) {
    const room = await prisma.telehealthRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");

    // Only SP can invite
    if (user.userType !== "SERVICE_PROVIDER") throw new gcprError(HttpStatus.FORBIDDEN, "Only service providers can invite users");

    const resolved = await TelehealthService.normalizeAttendees(attendees);
    if (resolved.length === 0) throw new gcprError(HttpStatus.BAD_REQUEST, "No valid attendees provided");

    WRITE.info("[Telehealth] Inviting users to room", {
      roomId,
      userId: user.id,
      attendeeCount: resolved.length
    });

    const joinUrl = room.joinUrl;
    await TelehealthService.inviteUsers(user, room, resolved, joinUrl);

    const totalInvited = resolved.length;

    WRITE.info("[Telehealth] Users invited", {
      roomId,
      invitedCount: totalInvited
    });

    return { invited: totalInvited, roomId };
  }

  static async getParticipants(user, roomId) {
    const room = await prisma.telehealthRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");

    const participants = await prisma.telehealthParticipant.findMany({
      where: { roomId },
      include: {
        user: { select: { id: true, fullName: true, profileImage: true } }
      }
    });

    return { total: participants.length, participants };
  }

  static async joinRoom(user, roomId) {
    const room = await prisma.telehealthRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new gcprError(HttpStatus.NOT_FOUND, "Telehealth room not found");
    if (room.status === "canceled") throw new gcprError(HttpStatus.BAD_REQUEST, "This room has been canceled");
    if (room.deletedAt) throw new gcprError(HttpStatus.BAD_REQUEST, "This room has been deleted");

    WRITE.info("[Telehealth] User joining room", { roomId, userId: user.id });

    // Upsert participant as joined
    await prisma.telehealthParticipant.upsert({
      where: { roomId_userId: { roomId, userId: user.id } },
      create: {
        roomId,
        userId: user.id,
        role: user.userType === "SERVICE_PROVIDER" ? "provider" : "caregiver",
        status: "joined",
        joinedAt: new Date()
      },
      update: { status: "joined", joinedAt: new Date() }
    });

    WRITE.info("[Telehealth] User joined room", { roomId, userId: user.id });

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

    WRITE.info("[Telehealth] Updating room status", {
      roomId,
      userId: user.id,
      fromStatus: room.status,
      toStatus: status
    });

    const updated = await prisma.telehealthRoom.update({ where: { id: roomId }, data: { status } });

    WRITE.info("[Telehealth] Room status updated", {
      roomId,
      newStatus: status
    });

    return updated;
  }
}

export default TelehealthService;