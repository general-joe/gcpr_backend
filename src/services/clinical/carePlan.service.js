import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import WRITE from "../../utils/logger.js";
import NotificationService from "../../modules/notification/notification.service.js";

class CarePlanService {
  static async generateFromAssessment(user, assessmentId) {
    const assessment = await prisma.clinicalAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        patient: true,
        provider: true,
        referral: true,
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

    const carePlan = await prisma.carePlan.create({
      data: {
        patientId: assessment.patientId,
        assessmentId: assessment.id,
        primaryProviderId,
        status: "ACTIVE",
        goals: [],
        interventions: [],
      },
      include: {
        patient: true,
        provider: true,
        assessment: true,
      },
    });

    if (user?.id) {
      await NotificationService.createNotification({
        userId: user.id,
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
    const carePlan = await prisma.carePlan.findFirst({
      where: {
        patientId,
        status: "ACTIVE",
      },
      include: {
        patient: true,
        provider: {
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

    return carePlan;
  }

  static async listCarePlans(user, patientId) {
    const where = patientId ? { patientId } : {};

    return prisma.carePlan.findMany({
      where,
      include: {
        patient: true,
        provider: {
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
        provider: true,
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
        provider: {
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
        provider: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}

export default CarePlanService;
