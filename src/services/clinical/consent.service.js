import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import NotificationService from "../../modules/notification/notification.service.js";
import WRITE from "../../utils/logger.js";
import { getPatientWithCaregiverUser, userCanAccessPatient } from "./clinicalAccess.service.js";

class ConsentService {
  static async createConsent(user, payload) {
    const { patientId, consentType, scope, documentId, method } = payload;

    const patient = await getPatientWithCaregiverUser(patientId);

    if (!user?.id) {
      throw new Error("Unauthorized");
    }

    const isCaregiverOwner = patient.caregiver?.userId === user.id;
    const isAdmin = await hasRbacRole(user, ["ADMIN"]);
    if (!isCaregiverOwner && !isAdmin) {
      throw new Error("Only the patient's caregiver or admin can grant consent");
    }

    const record = await prisma.consentRecord.create({
      data: {
        patientId,
        grantedByUserId: user.id,
        consentType,
        scope: scope ?? null,
        documentId: documentId ?? null,
        method: method || "DIGITAL_SIGNATURE",
      },
      include: {
        patient: true,
        grantedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (patient.caregiver?.userId) {
      await NotificationService.createNotification({
        userId: patient.caregiver.userId,
        type: "IN_APP",
        category: "SYSTEM",
        title: "Consent recorded",
        content: `Consent for ${consentType} has been recorded for ${patient.fullName}`,
        relatedId: record.id,
        relatedModel: "ConsentRecord",
      });
    }

    return record;
  }

  static async revokeConsent(user, consentId) {
    const record = await prisma.consentRecord.findUnique({
      where: { id: consentId },
    });

    if (!record) {
      throw new Error("Consent record not found");
    }

    if (record.grantedByUserId !== user?.id && !(await hasRbacRole(user, ["ADMIN"]))) {
      throw new Error("Not allowed");
    }

    const updated = await prisma.consentRecord.update({
      where: { id: consentId },
      data: {
        revokedAt: new Date(),
      },
    });

    return updated;
  }

  static async listConsents(user, patientId) {
    if (!(await userCanAccessPatient(user, patientId))) {
      throw new Error("Access to patient consent denied");
    }

    return prisma.consentRecord.findMany({
      where: {
        patientId,
        revokedAt: null,
      },
      include: {
        patient: true,
        grantedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        grantedAt: "desc",
      },
    });
  }
}

async function hasRbacRole(user, slugs) {
  if (!user?.id) return false;

  const userRoles = await prisma.userRole.findMany({
    where: {
      userId: user.id,
      active: true,
      role: {
        slug: {
          in: slugs,
        },
      },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  return userRoles.length > 0;
}

export default ConsentService;
