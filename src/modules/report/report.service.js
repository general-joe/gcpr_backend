import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import NotificationService from "../notification/notification.service.js";

export default class ReportService {
  static async createReport(userId, data) {
    if (data.reportType === "SERVICE_PROVIDER") {
      if (!data.targetUserId) {
        throw new gcprError(HttpStatus.BAD_REQUEST, "targetUserId is required for SERVICE_PROVIDER reports");
      }
      const target = await prisma.user.findUnique({
        where: { id: data.targetUserId },
        select: { id: true, userType: true }
      });
      if (!target) {
        throw new gcprError(HttpStatus.NOT_FOUND, "Target user not found");
      }
      if (target.userType !== "SERVICE_PROVIDER") {
        throw new gcprError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "Target user must have the SERVICE_PROVIDER user type"
        );
      }
    }

    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        reportType: data.reportType,
        targetUserId: data.targetUserId ?? null,
        subject: data.subject,
        description: data.description,
        evidence: data.evidence ?? []
      },
      include: {
        reporter: { select: { id: true, fullName: true, role: true } },
        targetUser: { select: { id: true, fullName: true, role: true } }
      }
    });

    // Notify all admin users
    try {
      const adminRole = await prisma.appRole.findUnique({ where: { slug: "ADMIN" } });
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
          title: "New Report Submitted",
          content: `A new ${data.reportType} report has been submitted: "${data.subject}"`,
          relatedId: report.id,
          relatedModel: "Report"
        });
      }
    } catch (e) {
      console.error("[Report] Admin notification failed:", e.message);
    }

    return report;
  }

  static async getMyReports(userId, query = {}) {
    const page = Math.max(1, parseInt(query.page ?? 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? 20, 10)));
    const skip = (page - 1) * limit;

    const where = { reporterId: userId };
    if (query.status) where.status = query.status;
    if (query.reportType) where.reportType = query.reportType;

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        include: {
          targetUser: { select: { id: true, fullName: true, role: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      })
    ]);

    return {
      data: reports,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  static async getReport(userId, reportId) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: { select: { id: true, fullName: true, role: true } },
        targetUser: { select: { id: true, fullName: true, role: true } }
      }
    });
    if (!report) throw new gcprError(HttpStatus.NOT_FOUND, "Report not found");
    if (report.reporterId !== userId) {
      throw new gcprError(HttpStatus.FORBIDDEN, "You do not have access to this report");
    }
    return report;
  }

  static async adminListReports(query = {}) {
    const page = Math.max(1, parseInt(query.page ?? 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? 20, 10)));
    const skip = (page - 1) * limit;

    const where = {};
    if (query.status) where.status = query.status;
    if (query.reportType) where.reportType = query.reportType;

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, fullName: true, email: true, role: true } },
          targetUser: { select: { id: true, fullName: true, email: true, role: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      })
    ]);

    return {
      data: reports,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  static async adminGetReport(reportId) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: { select: { id: true, fullName: true, email: true, role: true, phoneNumber: true } },
        targetUser: { select: { id: true, fullName: true, email: true, role: true, phoneNumber: true } }
      }
    });
    if (!report) throw new gcprError(HttpStatus.NOT_FOUND, "Report not found");
    return report;
  }

  static async adminUpdateReport(adminUserId, reportId, data) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new gcprError(HttpStatus.NOT_FOUND, "Report not found");

    const isResolved = data.status === "RESOLVED" || data.status === "DISMISSED";

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.adminNotes !== undefined && { adminNotes: data.adminNotes }),
        ...(isResolved && { resolvedBy: adminUserId, resolvedAt: new Date() })
      }
    });

    // Notify reporter about status change
    try {
      await NotificationService.createNotification({
        userId: report.reporterId,
        type: "IN_APP",
        category: "SYSTEM",
        title: "Report Status Updated",
        content: `Your report "${report.subject}" has been updated to ${data.status ?? report.status}.`,
        relatedId: report.id,
        relatedModel: "Report"
      });
    } catch (e) {
      console.error("[Report] Reporter notification failed:", e.message);
    }

    return updated;
  }
}
