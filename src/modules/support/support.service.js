import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import NotificationService from "../notification/notification.service.js";
import WRITE from "../../utils/logger.js";
import { sendEmail } from "../../utils/emailSmtp.js";
import { SendSMS } from "../../utils/hubtel-sms.js";

async function generateTicketNumber(tx) {
  const count = await tx.supportTicket.count();
  const year = new Date().getFullYear();
  return `TKT-${year}-${(count + 1).toString().padStart(5, "0")}`;
}

export default class SupportService {
  // ─── User Ticket Operations ────────────────────────────────────────────────

  static async createTicket(userId, data) {
    const ticket = await prisma.$transaction(async tx => {
      const ticketNumber = await generateTicketNumber(tx);
      return tx.supportTicket.create({
        data: {
          ticketNumber,
          userId,
          category: data.category,
          subject: data.subject,
          description: data.description,
          attachments: data.attachments ?? [],
          priority: data.priority ?? "MEDIUM",
          status: "OPEN"
        }
      });
    });

    // Confirmation notification to user
    try {
      await NotificationService.createNotification({
        userId,
        type: "IN_APP",
        category: "SYSTEM",
        title: "Support Ticket Created",
        content: `Your support ticket #${ticket.ticketNumber} has been submitted. We'll respond soon.`,
        relatedId: ticket.id,
        relatedModel: "SupportTicket"
      });
    } catch (e) {
      WRITE.error("[Support] User confirmation notification failed", { error: e.message });
    }

    // Notify all admins of new ticket
    try {
      const adminRole = await prisma.appRole.findUnique({ where: { slug: 'ADMIN' } });
      const admins = adminRole
        ? await prisma.user.findMany({
            where: { userRoles: { some: { roleId: adminRole.id, active: true } } },
            select: { id: true }
          })
        : [];
      for (const admin of admins) {
        await NotificationService.createNotification({
          userId: admin.id,
          type: "IN_APP",
          category: "SYSTEM",
          title: "New Support Ticket",
          content: `Ticket #${ticket.ticketNumber}: ${data.subject}`,
          relatedId: ticket.id,
          relatedModel: "SupportTicket"
        });
      }
    } catch (e) {
      WRITE.error("[Support] Admin notification failed", { error: e.message });
    }

    return ticket;
  }

  static async listTickets(userId, query = {}) {
    const page = Math.max(1, parseInt(query.page ?? 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? 20, 10)));
    const skip = (page - 1) * limit;

    const where = { userId };
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;

    const [total, tickets] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      })
    ]);

    return {
      data: tickets,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  static async getTicket(userId, ticketId) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, fullName: true, userType: true, profileImage: true } }
          }
        }
      }
    });
    if (!ticket) throw new gcprError(HttpStatus.NOT_FOUND, "Support ticket not found");
    if (ticket.userId !== userId) {
      throw new gcprError(HttpStatus.FORBIDDEN, "You do not have access to this ticket");
    }
    return ticket;
  }

  static async addMessage(userId, ticketId, content) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new gcprError(HttpStatus.NOT_FOUND, "Support ticket not found");
    if (ticket.userId !== userId) {
      throw new gcprError(HttpStatus.FORBIDDEN, "You do not have access to this ticket");
    }
    if (ticket.status === "CLOSED") {
      throw new gcprError(HttpStatus.UNPROCESSABLE_ENTITY, "Cannot reply to a closed ticket");
    }

    const [message] = await prisma.$transaction([
      prisma.ticketMessage.create({
        data: { ticketId, senderId: userId, content, isAdminReply: false },
        include: {
          sender: { select: { id: true, fullName: true, userType: true } }
        }
      }),
      prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: ticket.status === "WAITING_ON_USER" ? "OPEN" : ticket.status,
          updatedAt: new Date()
        }
      })
    ]);

    // Notify admins
    try {
      const adminRole = await prisma.appRole.findUnique({ where: { slug: 'ADMIN' } });
      const admins = adminRole
        ? await prisma.user.findMany({
            where: { userRoles: { some: { roleId: adminRole.id, active: true } } },
            select: { id: true }
          })
        : [];
      for (const admin of admins) {
        await NotificationService.createNotification({
          userId: admin.id,
          type: "IN_APP",
          category: "SYSTEM",
          title: "New Message on Support Ticket",
          content: `User replied on ticket #${ticket.ticketNumber}`,
          relatedId: ticketId,
          relatedModel: "SupportTicket"
        });
      }
    } catch (e) {
      WRITE.error("[Support] Admin reply notification failed", { error: e.message });
    }

    return message;
  }

  static async closeTicket(userId, ticketId) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new gcprError(HttpStatus.NOT_FOUND, "Support ticket not found");
    if (ticket.userId !== userId) {
      throw new gcprError(HttpStatus.FORBIDDEN, "You do not have access to this ticket");
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "CLOSED", closedAt: new Date() }
    });

    // Notify the ticket owner (confirmation)
    try {
      await NotificationService.createNotification({
        userId: ticket.userId,
        type: "IN_APP",
        category: "SYSTEM",
        title: "Support Ticket Closed",
        content: `Your support ticket #${ticket.ticketNumber} has been closed.`,
        relatedId: ticketId,
        relatedModel: "SupportTicket",
      });
    } catch (e) {
      WRITE.error("[Support] Close ticket notification failed", { error: e.message });
    }

    // Attempt to send an email to the ticket owner (if email available). Otherwise fall back to SMS.
    try {
      const user = await prisma.user.findUnique({ where: { id: ticket.userId }, select: { email: true, fullName: true, phoneNumber: true } });
      if (user?.email) {
        await sendEmail(user.email, "success", { name: user.fullName || "there", fullName: user.fullName });
      } else if (user?.phoneNumber) {
        // Fallback to Hubtel SMS
        try {
          const res = await SendSMS(user.phoneNumber, `Your support ticket #${ticket.ticketNumber} has been closed.`);
          WRITE.info("[Support] SMS sent via Hubtel", { to: user.phoneNumber, result: res });
        } catch (err) {
          WRITE.warn("[Support] Hubtel SMS failed", { error: err?.message || err, userId: ticket.userId });
        }
      }
    } catch (e) {
      WRITE.error("[Support] Close ticket notification/email failed", { error: e.message });
    }

    return updated;
  }

  // ─── Admin Ticket Operations ───────────────────────────────────────────────

  static async adminListTickets(query = {}) {
    const page = Math.max(1, parseInt(query.page ?? 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? 20, 10)));
    const skip = (page - 1) * limit;

    const where = {};
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;

    const [total, tickets] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, role: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      })
    ]);

    return {
      data: tickets,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  static async adminGetTicket(ticketId) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true, phoneNumber: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, fullName: true, userType: true, profileImage: true } }
          }
        }
      }
    });
    if (!ticket) throw new gcprError(HttpStatus.NOT_FOUND, "Support ticket not found");
    return ticket;
  }

  static async adminUpdateTicket(ticketId, data) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new gcprError(HttpStatus.NOT_FOUND, "Support ticket not found");

    const isResolved = data.status === "RESOLVED";

    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
        ...(isResolved && { resolvedAt: new Date() })
      }
    });
  }

  static async adminAddMessage(adminId, ticketId, content) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new gcprError(HttpStatus.NOT_FOUND, "Support ticket not found");

    const [message] = await prisma.$transaction([
      prisma.ticketMessage.create({
        data: { ticketId, senderId: adminId, content, isAdminReply: true },
        include: {
          sender: { select: { id: true, fullName: true, userType: true } }
        }
      }),
      prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: "WAITING_ON_USER", updatedAt: new Date() }
      })
    ]);

    // Notify the ticket owner
    try {
      await NotificationService.createNotification({
        userId: ticket.userId,
        type: "IN_APP",
        category: "SYSTEM",
        title: "Support Ticket Update",
        content: `Support has replied to your ticket #${ticket.ticketNumber}`,
        relatedId: ticketId,
        relatedModel: "SupportTicket"
      });
    } catch (e) {
      WRITE.error("[Support] User reply notification failed", { error: e.message });
    }

    return message;
  }
}
