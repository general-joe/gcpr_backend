import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";

class EnrollmentService {
  static async enrollPatient(user, data) {
    const patient = await prisma.cpPatient.findUnique({ where: { id: data.patientId }, select: { id: true } });
    if (!patient) throw new gcprError(HttpStatus.NOT_FOUND, "Patient not found");

    // Check if active enrollment exists
    const existing = await prisma.patientEnrollmentRecord.findUnique({
      where: { patientId: data.patientId }
    });

    if (existing && existing.status === "ACTIVE") {
      throw new gcprError(HttpStatus.CONFLICT, "Patient already has an active enrollment");
    }

    // If exists but not active, update it
    if (existing) {
      return prisma.patientEnrollmentRecord.update({
        where: { patientId: data.patientId },
        data: {
          status: "ACTIVE",
          enrolledByUserId: user.id,
          enrolledAt: new Date(),
          programName: data.programName || existing.programName,
          notes: data.notes || existing.notes,
          unenrolledAt: null,
          unenrollReason: null
        }
      });
    }

    return prisma.patientEnrollmentRecord.create({
      data: {
        patientId: data.patientId,
        enrolledByUserId: user.id,
        status: "ACTIVE",
        programName: data.programName || null,
        notes: data.notes || null
      }
    });
  }

  static async getEnrollmentByPatient(user, patientId) {
    const record = await prisma.patientEnrollmentRecord.findUnique({
      where: { patientId },
      include: { patient: { select: { id: true, fullName: true, gender: true } } }
    });

    if (!record) throw new gcprError(HttpStatus.NOT_FOUND, "Enrollment record not found");
    return record;
  }

  static async updateEnrollment(user, enrollmentId, data) {
    if (user.role !== "SERVICE_PROVIDER") throw new gcprError(HttpStatus.FORBIDDEN, "Only service providers can update enrollment status");

    const record = await prisma.patientEnrollmentRecord.findUnique({ where: { id: enrollmentId } });
    if (!record) throw new gcprError(HttpStatus.NOT_FOUND, "Enrollment record not found");

    const updateData = { status: data.status };
    if (data.unenrollReason !== undefined) updateData.unenrollReason = data.unenrollReason;
    if (data.status !== "ACTIVE") updateData.unenrolledAt = new Date();

    return prisma.patientEnrollmentRecord.update({ where: { id: enrollmentId }, data: updateData });
  }

  static async getEnrollmentStats(user) {
    if (user.role !== "SERVICE_PROVIDER") throw new gcprError(HttpStatus.FORBIDDEN, "Only service providers can view enrollment stats");

    const sp = await prisma.serviceProvider.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!sp) throw new gcprError(HttpStatus.NOT_FOUND, "Service provider profile not found");

    // Get patient IDs for this provider
    const patientIds = await prisma.rehabTask.findMany({
      where: { providerId: sp.id },
      select: { patientId: true },
      distinct: ["patientId"]
    }).then(rows => rows.map(r => r.patientId));

    const [totalEnrolled, newThisMonth, byStatus] = await Promise.all([
      prisma.patientEnrollmentRecord.count({ where: { patientId: { in: patientIds }, status: "ACTIVE" } }),
      prisma.patientEnrollmentRecord.count({
        where: {
          patientId: { in: patientIds },
          enrolledAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      }),
      prisma.patientEnrollmentRecord.groupBy({
        by: ["status"],
        where: { patientId: { in: patientIds } },
        _count: { status: true }
      })
    ]);

    const statusBreakdown = {};
    for (const row of byStatus) {
      statusBreakdown[row.status] = row._count.status;
    }

    return { totalEnrolled, newThisMonth, byStatus: statusBreakdown };
  }
}

export default EnrollmentService;
