import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import WRITE from "../../utils/logger.js";
import NotificationService from "../../modules/notification/notification.service.js";
import auditService from "../audit/audit.service.js";
import {
  assertPatientAccess,
  getPatientCaregiverUserId,
} from "./clinicalAccess.service.js";

class CarePlanService {
  static async generateFromAssessment(user, assessmentId) {
    const assessment = await prisma.clinicalAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        patient: true,
        provider: true,
        referral: true,
        reports: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!assessment) {
      throw new Error("Assessment not found");
    }

    if (assessment.status !== "APPROVED") {
      throw new Error("Only approved assessments can generate care plans");
    }

    const existingActive = await prisma.carePlan.findFirst({
      where: {
        patientId: assessment.patientId,
        status: "ACTIVE",
      },
    });

    if (existingActive) {
      throw new Error("Active care plan already exists for this patient");
    }

    const primaryProviderId = assessment.providerId;

    const latestReport = assessment.reports[0] ?? null;
    const carePlan = await prisma.carePlan.create({
      data: {
        patientId: assessment.patientId,
        assessmentId: assessment.id,
        primaryProviderId,
        status: "ACTIVE",
        goals: latestReport?.recommendations ?? [],
        interventions: latestReport?.recommendations ?? [],
        reviewDate: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000),
        createdBy: user?.id ?? null,
      },
      include: {
        patient: true,
        primaryProvider: true,
        assessment: true,
      },
    });

    const caregiverUserId = await getPatientCaregiverUserId(assessment.patientId);
    if (caregiverUserId) {
      await NotificationService.createNotification({
        userId: caregiverUserId,
        type: "IN_APP",
        category: "SYSTEM",
        title: "Care plan generated",
        content: `Care plan created from assessment ${assessment.id.slice(0, 8)}`,
        relatedId: carePlan.id,
        relatedModel: "CarePlan",
      });
    }

    return carePlan;
  }

  static async getCarePlan(user, patientId) {
    await assertPatientAccess(user, patientId);

    const carePlan = await prisma.carePlan.findFirst({
      where: {
        patientId,
        status: "ACTIVE",
      },
      include: {
        patient: true,
        primaryProvider: {
          include: {
            user: true,
          },
        },
        assessment: true,
        signatures: {
          include: {
            signer: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (carePlan) {
      await auditService.write({
        timestamp: new Date().toISOString(),
        requestId: `CLINICAL-${Date.now()}`,
        userId: user.id,
        userRole: user.userType,
        method: "READ",
        path: `/care-plan?patientId=${patientId}`,
        statusCode: 200,
        durationMs: 0,
        ipAddress: null,
        userAgent: null,
        eventType: "CLINICAL_RECORD_ACCESS",
        params: { patientId, carePlanId: carePlan.id },
      });
    }

    return carePlan;
  }

  static async listCarePlans(user, patientId) {
    if (patientId) {
      await assertPatientAccess(user, patientId);
    }

    const where = patientId ? { patientId } : {};

    return prisma.carePlan.findMany({
      where,
      include: {
        patient: true,
        primaryProvider: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async updateCarePlanStatus(user, carePlanId, status) {
    const carePlan = await prisma.carePlan.findUnique({
      where: { id: carePlanId },
      include: {
        primaryProvider: true,
      },
    });

    if (!carePlan) {
      throw new Error("Care plan not found");
    }

    return prisma.carePlan.update({
      where: { id: carePlanId },
      data: { status },
      include: {
        patient: true,
        primaryProvider: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  static async updateCarePlanContent(user, carePlanId, { goals, interventions, reviewDate }) {
    const carePlan = await prisma.carePlan.findUnique({
      where: { id: carePlanId },
    });

    if (!carePlan) {
      throw new Error("Care plan not found");
    }

    return prisma.carePlan.update({
      where: { id: carePlanId },
      data: {
        goals: goals ?? carePlan.goals,
        interventions: interventions ?? carePlan.interventions,
        reviewDate: reviewDate ?? carePlan.reviewDate,
      },
      include: {
        patient: true,
        primaryProvider: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}

export default CarePlanService;
