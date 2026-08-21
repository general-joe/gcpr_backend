import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import NotificationService from "../notification/notification.service.js";
import WRITE from "../../utils/logger.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

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
      WRITE.error("[Report] Admin notification failed", { error: e.message });
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
      WRITE.error("[Report] Reporter notification failed", { error: e.message });
    }

    return updated;
  }

  static async downloadReports(userId, query = {}) {
    const { format = "csv", status, reportType } = query;

    const where = { reporterId: userId };
    if (status) where.status = status;
    if (reportType) where.reportType = reportType;

    const reports = await prisma.report.findMany({
      where,
      include: {
        targetUser: { select: { id: true, fullName: true, role: true } }
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = reports.map((r) => ({
      id: r.id,
      reportType: r.reportType,
      targetUser: r.targetUser?.fullName ?? "",
      subject: r.subject,
      description: r.description,
      status: r.status,
      adminNotes: r.adminNotes ?? "",
      evidence: (r.evidence ?? []).join("; "),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : "",
    }));

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `reports-${timestamp}`;

    switch (format.toLowerCase()) {
      case "excel": {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Reports");

        worksheet.columns = [
          { header: "ID", key: "id", width: 36 },
          { header: "Report Type", key: "reportType", width: 20 },
          { header: "Target User", key: "targetUser", width: 25 },
          { header: "Subject", key: "subject", width: 30 },
          { header: "Description", key: "description", width: 40 },
          { header: "Status", key: "status", width: 15 },
          { header: "Admin Notes", key: "adminNotes", width: 30 },
          { header: "Evidence", key: "evidence", width: 40 },
          { header: "Created At", key: "createdAt", width: 25 },
          { header: "Updated At", key: "updatedAt", width: 25 },
          { header: "Resolved At", key: "resolvedAt", width: 25 },
        ];

        rows.forEach((row) => worksheet.addRow(row));
        worksheet.getRow(1).font = { bold: true };

        const buffer = await workbook.xlsx.writeBuffer();
        return {
          buffer,
          filename: `${filename}.xlsx`,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
      }
      case "pdf": {
        const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {});

        doc.fontSize(18).text("Reports Export", { align: "center" });
        doc.moveDown();
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
        doc.moveDown();

        const headers = [
          { key: "id", label: "ID", width: 80 },
          { key: "reportType", label: "Type", width: 60 },
          { key: "targetUser", label: "Target", width: 80 },
          { key: "subject", label: "Subject", width: 100 },
          { key: "status", label: "Status", width: 70 },
          { key: "createdAt", label: "Created", width: 90 },
        ];

        const startX = doc.page.margins.left;
        let y = doc.y;

        doc.font("Helvetica-Bold").fontSize(8);
        let x = startX;
        headers.forEach((h) => {
          doc.text(h.label, x, y, { width: h.width });
          x += h.width;
        });
        y += 15;
        doc.font("Helvetica").fontSize(7);

        for (const row of rows) {
          if (y > doc.page.height - doc.page.margins.bottom - 20) {
            doc.addPage();
            y = doc.page.margins.top;
            doc.font("Helvetica-Bold").fontSize(8);
            x = startX;
            headers.forEach((h) => {
              doc.text(h.label, x, y, { width: h.width });
              x += h.width;
            });
            y += 15;
            doc.font("Helvetica").fontSize(7);
          }
          x = startX;
          headers.forEach((h) => {
            const val = row[h.key] ?? "";
            doc.text(String(val).substring(0, 50), x, y, { width: h.width });
            x += h.width;
          });
          y += 14;
        }

        doc.end();

        return new Promise((resolve, reject) => {
          doc.on("end", () => {
            const buffer = Buffer.concat(chunks);
            resolve({
              buffer,
              filename: `${filename}.pdf`,
              contentType: "application/pdf",
            });
          });
          doc.on("error", reject);
        });
      }
      case "csv":
      default: {
        const headers = [
          "id",
          "reportType",
          "targetUser",
          "subject",
          "description",
          "status",
          "adminNotes",
          "evidence",
          "createdAt",
          "updatedAt",
          "resolvedAt",
        ];
        const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
        return {
          buffer: Buffer.from(csv),
          filename: `${filename}.csv`,
          contentType: "text/csv",
        };
      }
    }
  }
}
