import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import gcprError from "../../utils/http-error.js";
import CpPatientService from "../cpPatient/cpPatient.service.js";

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

export default class DashboardService {
  static async caregiverDashboard(user) {
    const caregiver = await prisma.careGiver.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!caregiver) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Caregiver profile not found");
    }

    const patientResult = await CpPatientService.fetchPatients(user.id, 1, 20);
    const patientIds = patientResult.data.map((patient) => patient.id);

    const [todayTasks, upcomingAppointments, prescribedResources] =
      await Promise.all([
        prisma.rehabTask.findMany({
          where: {
            patientId: { in: patientIds },
            status: { in: ["PENDING", "ASSIGNED"] },
            OR: [{ startDate: null }, { startDate: { lte: endOfToday() } }],
          },
          include: { patient: { select: { id: true, fullName: true } }, provider: { include: { user: { select: { fullName: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.appointment.findMany({
          where: { patientId: { in: patientIds }, appointmentDate: { gte: new Date() } },
          include: { patient: { select: { id: true, fullName: true } }, provider: { include: { user: { select: { fullName: true } } } } },
          orderBy: { appointmentDate: "asc" },
          take: 10,
        }),
        prisma.resourcePrescription.findMany({
          where: { patientId: { in: patientIds } },
          include: { resource: true, patient: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

    return {
      patients: patientResult.data,
      pagination: patientResult.pagination,
      todayTasks,
      upcomingAppointments,
      prescribedResources,
    };
  }

  static async providerDashboard(user) {
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
      include: { user: { select: { id: true, fullName: true } } },
    });

    if (!provider) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Service provider profile not found");
    }

    const [todayAppointments, pendingReferrals, activeTasks] =
      await Promise.all([
        prisma.appointment.findMany({
          where: {
            providerId: provider.id,
            appointmentDate: { gte: startOfToday(), lte: endOfToday() },
          },
          include: { patient: { select: { id: true, fullName: true } } },
          orderBy: { appointmentDate: "asc" },
        }),
        prisma.clinicalReferral.findMany({
          where: {
            status: "PENDING",
            OR: [{ toProviderId: provider.id }, { toProviderId: null, toProfession: provider.profession }],
          },
          include: { patient: { select: { id: true, fullName: true } }, fromProvider: { include: { user: { select: { fullName: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.rehabTask.findMany({
          where: { providerId: provider.id, status: { in: ["PENDING", "ASSIGNED"] } },
          include: { patient: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ]);

    return {
      provider,
      todayAppointments,
      pendingReferrals,
      activeTasks,
    };
  }
}
