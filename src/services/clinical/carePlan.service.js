import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import gcprError from "../../utils/http-error.js";
import WRITE from "../../utils/logger.js";
import NotificationService from "../../modules/notification/notification.service.js";
import auditService from "../audit/audit.service.js";
import {
  assertPatientAccess,
  getPatientCaregiverUserId,
} from "./clinicalAccess.service.js";

class CarePlanService {
  static VALID_STATUSES = new Set(["ACTIVE", "COMPLETED", "SUPERSEDED"]);

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

    if (!["APPROVED", "COMPLETED"].includes(assessment.status)) {
      throw new Error("Only completed or approved assessments can generate care plans");
    }

    const existingActive = await prisma.carePlan.findFirst({
      where: {
        patientId: assessment.patientId,
        status: "ACTIVE",
      },
    });

    if (existingActive) {
      return prisma.carePlan.findUnique({
        where: { id: existingActive.id },
        include: {
          patient: true,
          primaryProvider: {
            include: { user: true },
          },
          assessment: true,
          signatures: {
            include: { signer: true },
            orderBy: { signedAt: "desc" },
          },
          rehabTasks: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
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
        primaryProvider: {
          include: { user: true },
        },
        assessment: true,
        signatures: {
          include: { signer: true },
          orderBy: { signedAt: "desc" },
        },
        rehabTasks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    try {
      const caregiverUserId = await getPatientCaregiverUserId(assessment.patientId);
      if (caregiverUserId) {
        const notification = await NotificationService.createNotification({
          userId: caregiverUserId,
          type: "IN_APP",
          category: "SYSTEM",
          title: "Care plan generated",
          content: `A new care plan has been created for ${assessment.patient.fullName}.`,
          relatedId: carePlan.id,
          relatedModel: "CarePlan",
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        });

        WRITE.info("[CarePlan] Caregiver notification created", {
          carePlanId: carePlan.id,
          patientId: assessment.patientId,
          caregiverUserId,
          notificationId: notification.id,
        });
      } else {
        WRITE.warn("[CarePlan] Caregiver notification skipped because patient has no caregiver user", {
          carePlanId: carePlan.id,
          patientId: assessment.patientId,
        });
      }
    } catch (error) {
      WRITE.error("[CarePlan] Caregiver notification failed", {
        carePlanId: carePlan.id,
        patientId: assessment.patientId,
        error: error.message,
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
        rehabTasks: {
          orderBy: { createdAt: "desc" },
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
        rehabTasks: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async updateCarePlan(user, carePlanId, { status, goals, interventions, reviewDate }) {
    const carePlan = await prisma.carePlan.findUnique({
      where: { id: carePlanId },
      include: {
        primaryProvider: true,
      },
    });

    if (!carePlan) {
      throw new Error("Care plan not found");
    }

    const updateData = {};
    if (status !== undefined) {
      if (!CarePlanService.VALID_STATUSES.has(status)) {
        throw new gcprError(HttpStatus.BAD_REQUEST, "Invalid care plan status");
      }
      updateData.status = status;
    }
    if (goals !== undefined) updateData.goals = goals;
    if (interventions !== undefined) updateData.interventions = interventions;
    if (reviewDate !== undefined) {
      const parsedReviewDate = new Date(reviewDate);
      if (Number.isNaN(parsedReviewDate.getTime())) {
        throw new gcprError(HttpStatus.BAD_REQUEST, "Invalid reviewDate value");
      }
      updateData.reviewDate = parsedReviewDate;
    }

    if (Object.keys(updateData).length === 0) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "Provide at least one care plan field to update",
      );
    }

    return prisma.carePlan.update({
      where: { id: carePlanId },
      data: updateData,
      include: {
        patient: true,
        primaryProvider: {
          include: {
            user: true,
          },
        },
        rehabTasks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }
}

export default CarePlanService;
