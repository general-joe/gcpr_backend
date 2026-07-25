import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import NotificationService from "../notification/notification.service.js";
import gcprError from "../../utils/http-error.js";
import WRITE from "../../utils/logger.js";
import { assertPatientAccess } from "../../services/clinical/clinicalAccess.service.js";

class FunctionalClassificationService {
  // ─── Guards ────────────────────────────────────────────────────────────────

  static async requireVerifiedServiceProvider(userId) {
    if (!userId) {
      throw new gcprError(HttpStatus.UNAUTHORIZED, "Unauthorized request");
    }

    const sp = await prisma.serviceProvider.findUnique({ where: { userId } });

    if (!sp) {
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        "Service provider profile not found"
      );
    }

    if (sp.verificationStatus !== "VERIFIED") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Your account is pending verification. Contact admin to complete verification before performing clinical actions."
      );
    }

    return sp;
  }

  static async requireServiceProvider(userId) {
    if (!userId) {
      throw new gcprError(HttpStatus.UNAUTHORIZED, "Unauthorized request");
    }
    const sp = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (!sp) {
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        "Service provider profile not found"
      );
    }
    return sp;
  }

  static async ensurePatientExists(patientId) {
    const patient = await prisma.cpPatient.findUnique({
      where: { id: patientId },
      select: { id: true, fullName: true },
    });
    if (!patient) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Patient not found");
    }
    return patient;
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  static async create(user, data) {
    const sp =
      await FunctionalClassificationService.requireVerifiedServiceProvider(
        user.id
      );
    const patient = await FunctionalClassificationService.ensurePatientExists(
      data.patientId
    );

    // Find most recent prior classification for the same patient + classifier
    // to auto-compute MotorFunctionOutcome
    const priorFC = await prisma.functionalClassification.findFirst({
      where: { patientId: data.patientId, classifier: data.classifier },
      orderBy: { assessedAt: "desc" },
    });

    const fc = await prisma.functionalClassification.create({
      data: {
        patientId: data.patientId,
        assessorId: sp.id,
        classifier: data.classifier,
        level: data.level,
        assessedAt: data.assessedAt,
        notes: data.notes ?? null,
      },
      include: {
        patient: { select: { id: true, fullName: true } },
        assessor: {
          select: {
            id: true,
            profession: true,
            user: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    // Auto-generate MotorFunctionOutcome from baseline comparison
    if (priorFC) {
      const direction =
        data.level < priorFC.level
          ? "IMPROVED"
          : data.level > priorFC.level
            ? "REGRESSED"
            : "STABLE";

      const pctChange =
        priorFC.level > 0
          ? parseFloat(
              (((priorFC.level - data.level) / priorFC.level) * 100).toFixed(2)
            )
          : 0;

      try {
        await prisma.motorFunctionOutcome.create({
          data: {
            patientId: data.patientId,
            assessorId: sp.id,
            baselineLevel: priorFC.level,
            currentLevel: data.level,
            baselineDate: priorFC.assessedAt,
            reviewDate: data.assessedAt,
            outcomeDirection: direction,
            percentageChange: pctChange,
            assessmentToolUsed: data.classifier,
            notes: `Auto-generated from ${data.classifier} classification comparison`,
          },
        });
      } catch (err) {
        WRITE.warn("[FC] Auto-create MotorFunctionOutcome failed", {
          err: err.message,
        });
      }
    }

    // Notify caregiver that a classification was recorded
    try {
      const patientWithCaregiver = await prisma.cpPatient.findUnique({
        where: { id: data.patientId },
        select: { caregiverId: true, caregiver: { select: { userId: true } } },
      });
      if (patientWithCaregiver?.caregiver?.userId) {
        await NotificationService.createNotification({
          userId: patientWithCaregiver.caregiver.userId,
          type: "IN_APP",
          category: "SYSTEM",
          title: "Functional Classification Recorded",
          content: `A ${data.classifier} Level ${data.level} classification has been recorded for ${patient.fullName}.`,
          relatedId: fc.id,
          relatedModel: "FunctionalClassification",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      }
    } catch (e) {
      WRITE.warn("[FC] Notification failed", { err: e.message });
    }

    return fc;
  }

  // ─── Read (list by patient) ────────────────────────────────────────────────

  static async getByPatient(user, patientId, query = {}) {
    await FunctionalClassificationService.ensurePatientExists(patientId);
    await assertPatientAccess(user, patientId);

    const page = Math.max(1, parseInt(query.page ?? 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? 20, 10)));
    const skip = (page - 1) * limit;

    const where = {
      patientId,
      ...(query.classifier && { classifier: query.classifier }),
    };

    const [total, records] = await Promise.all([
      prisma.functionalClassification.count({ where }),
      prisma.functionalClassification.findMany({
        where,
        include: {
          assessor: {
            select: {
              id: true,
              profession: true,
              user: { select: { id: true, fullName: true } },
            },
          },
        },
        orderBy: { assessedAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      patientId,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      records,
    };
  }

  // ─── Read (single) ─────────────────────────────────────────────────────────

  static async getOne(user, id) {
    const fc = await prisma.functionalClassification.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, fullName: true } },
        assessor: {
          select: {
            id: true,
            profession: true,
            user: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!fc) {
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        "Functional classification record not found"
      );
    }

    await assertPatientAccess(user, fc.patientId);

    return fc;
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  static async update(user, id, data) {
    const sp =
      await FunctionalClassificationService.requireVerifiedServiceProvider(
        user.id
      );

    const fc = await prisma.functionalClassification.findUnique({
      where: { id },
    });
    if (!fc) {
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        "Functional classification record not found"
      );
    }

    if (fc.assessorId !== sp.id) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You can only update your own classification records"
      );
    }

    const updated = await prisma.functionalClassification.update({
      where: { id },
      data: {
        ...(data.level !== undefined && { level: data.level }),
        ...(data.assessedAt !== undefined && { assessedAt: data.assessedAt }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        patient: { select: { id: true, fullName: true } },
        assessor: {
          select: {
            id: true,
            profession: true,
            user: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    return updated;
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  static async delete(user, id) {
    const sp =
      await FunctionalClassificationService.requireVerifiedServiceProvider(
        user.id
      );

    const fc = await prisma.functionalClassification.findUnique({
      where: { id },
    });
    if (!fc) {
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        "Functional classification record not found"
      );
    }

    if (fc.assessorId !== sp.id) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You can only delete your own classification records"
      );
    }

    await prisma.functionalClassification.delete({ where: { id } });

    return { deleted: true, id };
  }

  // ─── Progress summary per patient ─────────────────────────────────────────

  static async getProgressSummary(user, patientId) {
    const patient =
      await FunctionalClassificationService.ensurePatientExists(patientId);
    await assertPatientAccess(user, patientId);

    const records = await prisma.functionalClassification.findMany({
      where: { patientId },
      orderBy: { assessedAt: "desc" },
    });

    const ALL_CLASSIFIERS = [
      "GMFCS",
      "MACS",
      "CFCS",
      "EDACS",
      "VIKING_SPEECH_SCALE",
      "OTHER",
    ];

    const summary = {};
    for (const classifier of ALL_CLASSIFIERS) {
      const subset = records.filter((r) => r.classifier === classifier);
      if (subset.length === 0) continue;

      const latest = subset[0];
      const prior = subset[1] ?? null;

      summary[classifier] = {
        latestLevel: latest.level,
        assessedAt: latest.assessedAt,
        trend: prior
          ? latest.level < prior.level
            ? "IMPROVING"
            : latest.level > prior.level
              ? "DECLINING"
              : "STABLE"
          : "NO_PRIOR_DATA",
        totalAssessments: subset.length,
      };
    }

    const latestOutcome = await prisma.motorFunctionOutcome.findFirst({
      where: { patientId },
      orderBy: { reviewDate: "desc" },
    });

    return {
      patient,
      classifierSummary: summary,
      latestMotorOutcome: latestOutcome,
    };
  }
}

export default FunctionalClassificationService;
