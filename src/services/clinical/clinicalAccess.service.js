import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import gcprError from "../../utils/http-error.js";
import { hasRbacRole } from "../../middlewares/auth.js";

export async function getPatientWithCaregiverUser(patientId) {
  const patient = await prisma.cpPatient.findUnique({
    where: { id: patientId },
    include: {
      caregiver: {
        select: {
          id: true,
          userId: true,
          user: { select: { id: true, fullName: true, phoneNumber: true, email: true } },
        },
      },
    },
  });

  if (!patient) {
    throw new gcprError(HttpStatus.NOT_FOUND, "Patient not found");
  }

  return patient;
}

export async function getPatientCaregiverUserId(patientId) {
  const patient = await getPatientWithCaregiverUser(patientId);
  return patient.caregiver?.userId ?? null;
}

export async function getServiceProviderForUser(userId) {
  if (!userId) return null;

  return prisma.serviceProvider.findUnique({
    where: { userId },
    select: { id: true, userId: true, profession: true, verificationStatus: true },
  });
}

export async function userCanAccessPatient(user, patientId) {
  if (!user?.id || !patientId) return false;

  if (await hasRbacRole(user.id, ["ADMIN", "CLINICAL_REVIEWER", "TESTER"])) {
    return true;
  }

  const patient = await getPatientWithCaregiverUser(patientId);

  if (user.userType === "CAREGIVER") {
    return patient.caregiver?.userId === user.id;
  }

  if (user.userType !== "SERVICE_PROVIDER") {
    return false;
  }

  const provider = await getServiceProviderForUser(user.id);
  if (!provider) return false;

  const [appointmentCount, assessmentCount, referralCount, taskCount, consentCount] =
    await Promise.all([
      prisma.appointment.count({ where: { patientId, providerId: provider.id } }),
      prisma.clinicalAssessment.count({ where: { patientId, providerId: provider.id } }),
      prisma.clinicalReferral.count({
        where: {
          patientId,
          OR: [{ fromProviderId: provider.id }, { toProviderId: provider.id }],
        },
      }),
      prisma.rehabTask.count({ where: { patientId, providerId: provider.id } }),
      prisma.consentRecord.count({
        where: {
          patientId,
          revokedAt: null,
          consentType: { in: ["TREATMENT", "DATA_SHARING"] },
          OR: [
            { scope: null },
            { scope: "ALL_PROVIDERS" },
            { scope: provider.id },
            { scope: `PROVIDER:${provider.id}` },
            { scope: { contains: provider.id } },
          ],
        },
      }),
    ]);

  return appointmentCount + assessmentCount + referralCount + taskCount + consentCount > 0;
}

export async function assertPatientAccess(user, patientId) {
  if (!(await userCanAccessPatient(user, patientId))) {
    throw new gcprError(HttpStatus.FORBIDDEN, "Access to patient denied");
  }
}
