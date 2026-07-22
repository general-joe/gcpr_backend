import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import NotificationService from "../notification/notification.service.js";
import { hasRbacRole } from "../../middlewares/auth.js";
import auditService from "../../services/audit/audit.service.js";
import { assertPatientAccess } from "../../services/clinical/clinicalAccess.service.js";

const latestByPatientId = (records) => {
  const byPatientId = new Map();

  for (const record of records) {
    if (!byPatientId.has(record.patientId)) {
      byPatientId.set(record.patientId, record);
    }
  }

  return byPatientId;
};

async function enrichPatients(patients) {
  if (patients.length === 0) {
    return [];
  }

  const patientIds = patients.map((patient) => patient.id);
  const now = new Date();

  const [assessments, appointments, referrals, taskCounts] = await Promise.all([
    prisma.clinicalAssessment.findMany({
      where: { patientId: { in: patientIds } },
      orderBy: { createdAt: "desc" },
      select: { id: true, patientId: true, status: true },
    }),
    prisma.appointment.findMany({
      where: { patientId: { in: patientIds }, appointmentDate: { gte: now } },
      orderBy: { appointmentDate: "asc" },
      select: { id: true, patientId: true, appointmentDate: true },
    }),
    prisma.clinicalReferral.findMany({
      where: { patientId: { in: patientIds } },
      orderBy: { createdAt: "desc" },
      select: { id: true, patientId: true, status: true },
    }),
    prisma.rehabTask.groupBy({
      by: ["patientId"],
      where: { patientId: { in: patientIds }, NOT: { status: "COMPLETED" } },
      _count: { _all: true },
    }),
  ]);

  const latestAssessmentByPatient = latestByPatientId(assessments);
  const nextAppointmentByPatient = latestByPatientId(appointments);
  const latestReferralByPatient = latestByPatientId(referrals);
  const openTaskCountByPatient = new Map(
    taskCounts.map((taskCount) => [taskCount.patientId, taskCount._count._all]),
  );

  return patients.map((patient) => ({
    ...patient,
    latestAssessmentStatus: latestAssessmentByPatient.get(patient.id)?.status || null,
    nextAppointmentDate: nextAppointmentByPatient.get(patient.id)?.appointmentDate || null,
    latestReferralStatus: latestReferralByPatient.get(patient.id)?.status || null,
    openTasksCount: openTaskCountByPatient.get(patient.id) || 0,
  }));
}

class CpPatientService {
  static async requireCaregiver(userId) {
    if (!userId) {
      throw new gcprError(HttpStatus.UNAUTHORIZED, "Unauthorized request");
    }

    const caregiver = await prisma.careGiver.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!caregiver) {
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        "Caregiver profile not found for this user",
      );
    }

    return caregiver;
  }

  static async ensureCaregiverOwnsPatient(caregiverId, patientId) {
    if (!patientId) {
      throw new gcprError(HttpStatus.BAD_REQUEST, "Patient ID is required");
    }

    const patient = await prisma.cpPatient.findUnique({
      where: { id: patientId },
      select: { id: true, caregiverId: true, fullName: true },
    });

    if (!patient) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Patient not found");
    }

    if (patient.caregiverId !== caregiverId) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You do not have access to this patient's tasks",
      );
    }

    return patient;
  }

  static async createPatient(data, userId) {
    if (!data) {
      throw new Error("Request body is missing");
    }

    if (!userId) {
      throw new gcprError(HttpStatus.UNAUTHORIZED, "Unauthorized request");
    }

    const dateOfBirth = new Date(data.dateOfBirth);

    if (isNaN(dateOfBirth.getTime())) {
      throw new Error("Invalid dateOfBirth");
    }

    const caregiver = await prisma.careGiver.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!caregiver) {
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        "Caregiver profile not found for this user",
      );
    }

    const patient = await prisma.cpPatient.create({
      data: {
        fullName: data.fullName,
        dateOfBirth,
        gender: data.gender,
        address: data.address,
        placeOfBirth: data.placeOfBirth,
        birthWeight: data.birthWeight,
        numberOfSiblings: data.numberOfSiblings,
        caregiverId: caregiver.id,
        relationToCaregiver: data.relationToCaregiver,
        householdSize: data.householdSize,
        schoolEnrollmentStatus: data.schoolEnrollmentStatus ?? false,
        typeOfSchool: data.typeOfSchool,
      },
    });

    // Notify caregiver user on patient creation
    try {
      await NotificationService.createNotification({
        userId,
        type: "IN_APP",
        category: "SYSTEM",
        title: "Patient Profile Created",
        content: `Patient profile for ${data.fullName} has been created successfully.`,
        relatedId: patient.id,
        relatedModel: "cpPatient",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    } catch (e) {
      console.error("[Notification] Patient creation notification failed:", e.message);
    }

    // Auto-enroll patient in the CP programme
    try {
      await prisma.patientEnrollmentRecord.create({
        data: {
          patientId: patient.id,
          enrolledByUserId: userId,
          status: "ACTIVE",
          programName: "GCPR Cerebral Palsy Rehabilitation Programme",
        },
      });
    } catch (e) {
      WRITE.warn("[Enrollment] Auto-enrollment failed", {
        patientId: patient.id,
        err: e.message,
      });
    }

    return patient;
  }

  static async fetchPatients(userId, page = 1, limit = 10) {
    if (!userId) {
      throw new gcprError(HttpStatus.UNAUTHORIZED, "Unauthorized request");
    }

    const caregiver = await prisma.careGiver.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (caregiver) {
      const skip = (page - 1) * limit;
      const [patients, total] = await Promise.all([
        prisma.cpPatient.findMany({
          where: { caregiverId: caregiver.id },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
              caregiver: {
                select: {
                  id: true,
                  user: {
                    select: { id: true, fullName: true },
                  },
                },
              },
          },
        }),
        prisma.cpPatient.count({
          where: { caregiverId: caregiver.id },
        }),
      ]);

      const enrichedPatients = await enrichPatients(patients);

      return {
        data: enrichedPatients,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { userId },
      include: { user: { select: { userType: true } } },
    });

    if (serviceProvider) {
      const adminRoleCheck = await hasRbacRole(userId, ["ADMIN"]);
      const isPhysiotherapist = serviceProvider.profession === "PHYSIOTHERAPIST";

      if (adminRoleCheck || isPhysiotherapist) {
        const skip = (page - 1) * limit;
        const [patients, total] = await Promise.all([
          prisma.cpPatient.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
              caregiver: {
                select: {
                  id: true,
                  user: {
                    select: { id: true, fullName: true },
                  },
                },
              },
            },
          }),
          prisma.cpPatient.count(),
        ]);

        const enrichedPatients = await enrichPatients(patients);

        return {
          data: enrichedPatients,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      }

      const referredPatientIds = await prisma.clinicalReferral.findMany({
        where: {
          OR: [
            { fromProviderId: serviceProvider.id },
            { toProviderId: serviceProvider.id },
          ],
        },
        select: { patientId: true },
        distinct: ["patientId"],
      });

      const taskPatientIds = await prisma.rehabTask.findMany({
        where: { providerId: serviceProvider.id },
        select: { patientId: true },
        distinct: ["patientId"],
      });

      const accessiblePatientIds = new Set([
        ...referredPatientIds.map((r) => r.patientId),
        ...taskPatientIds.map((t) => t.patientId),
      ]);

      const patientList = accessiblePatientIds.size === 0
        ? []
        : await prisma.cpPatient.findMany({
            where: { id: { in: [...accessiblePatientIds] } },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: {
              caregiver: {
                select: {
                  id: true,
                  user: {
                    select: { id: true, fullName: true },
                  },
                },
              },
            },
          });

      const enrichedPatients = await enrichPatients(patientList);

      return {
        data: enrichedPatients,
        pagination: {
          page,
          limit,
          total: accessiblePatientIds.size,
          totalPages: Math.ceil(accessiblePatientIds.size / limit),
        },
      };
    }

    throw new gcprError(
      HttpStatus.NOT_FOUND,
      "You do not have a caregiver or service provider profile",
    );
  }

  static async getPatientTimeline(user, patientId) {
    await assertPatientAccess(user, patientId);

    const [
      patient,
      assessments,
      referrals,
      tasks,
      appointments,
      classifications,
      carePlans,
      resourcePrescriptions,
    ] = await Promise.all([
      prisma.cpPatient.findUnique({
        where: { id: patientId },
        include: { caregiver: { include: { user: { select: { id: true, fullName: true, phoneNumber: true, email: true } } } } },
      }),
      prisma.clinicalAssessment.findMany({
        where: { patientId },
        include: { reports: { orderBy: { createdAt: "desc" }, take: 1 }, provider: { include: { user: { select: { id: true, fullName: true } } } } },
        orderBy: { assessedAt: "desc" },
        take: 20,
      }),
      prisma.clinicalReferral.findMany({
        where: { patientId },
        include: { fromProvider: { include: { user: { select: { fullName: true } } } }, toProvider: { include: { user: { select: { fullName: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.rehabTask.findMany({
        where: { patientId },
        include: { provider: { include: { user: { select: { fullName: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.appointment.findMany({
        where: { patientId },
        include: { provider: { include: { user: { select: { fullName: true } } } } },
        orderBy: { appointmentDate: "desc" },
        take: 20,
      }),
      prisma.functionalClassification.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.carePlan.findMany({
        where: { patientId },
        include: { primaryProvider: { include: { user: { select: { fullName: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.resourcePrescription.findMany({
        where: { patientId },
        include: { resource: true, provider: { include: { user: { select: { fullName: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    await auditService.write({
      timestamp: new Date().toISOString(),
      requestId: `CLINICAL-${Date.now()}`,
      userId: user.id,
      userRole: user.userType,
      method: "READ",
      path: `/cp-patient/${patientId}/timeline`,
      statusCode: 200,
      durationMs: 0,
      ipAddress: null,
      userAgent: null,
      eventType: "CLINICAL_RECORD_ACCESS",
      params: { patientId },
    });

    return {
      patient,
      timeline: {
        assessments,
        referrals,
        tasks,
        appointments,
        classifications,
        carePlans,
        resourcePrescriptions,
      },
    };
  }

  static async getAssignedTasks(userId, patientId) {
    const caregiver = await CpPatientService.requireCaregiver(userId);
    const patient = await CpPatientService.ensureCaregiverOwnsPatient(
      caregiver.id,
      patientId,
    );

    // Include completed tasks so caregiver can track done tasks.
    const tasks = await prisma.rehabTask.findMany({
      where: {
        patientId: patientId,
        status: { in: ["ASSIGNED", "COMPLETED"] },
      },
      include: {
        provider: {
          select: {
            id: true,
            user: {
              select: { fullName: true, phoneNumber: true },
            },
            profession: true,
            facilityName: true,
          },
        },
        referral: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      patient: {
        id: patient.id,
        fullName: patient.fullName,
      },
      total: tasks.length,
      tasks,
    };
  }

  static async getCaregiverTaskForPatient(caregiverId, patientId, taskId) {
    await CpPatientService.ensureCaregiverOwnsPatient(caregiverId, patientId);

    const task = await prisma.rehabTask.findFirst({
      where: {
        id: taskId,
        patientId,
      },
      include: {
        provider: {
          select: {
            id: true,
            user: {
              select: { fullName: true, phoneNumber: true },
            },
            profession: true,
            facilityName: true,
          },
        },
        referral: {
          select: { id: true, status: true },
        },
      },
    });

    if (!task) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Task not found");
    }

    if (task.status === "PENDING") {
      throw new gcprError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Task is not yet assigned",
      );
    }

    return task;
  }

  static async markTaskDayDone(userId, patientId, taskId, date) {
    const caregiver = await CpPatientService.requireCaregiver(userId);
    const task = await CpPatientService.getCaregiverTaskForPatient(
      caregiver.id,
      patientId,
      taskId,
    );

    const completionDate = date ? new Date(date) : new Date();
    if (Number.isNaN(completionDate.getTime())) {
      throw new gcprError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Invalid completion date",
      );
    }

    const dateKey = completionDate.toISOString().slice(0, 10);
    const doneSet = new Set(
      Array.isArray(task.completedDates) ? task.completedDates : [],
    );
    doneSet.add(dateKey);

    const completedDates = Array.from(doneSet).sort();
    const durationDays = task.durationDays ?? 0;
    const progress =
      durationDays > 0
        ? Math.min(
            100,
            Math.round((completedDates.length / durationDays) * 100),
          )
        : 0;
    const isCompleted = durationDays > 0 && completedDates.length >= durationDays;

    const updatedTask = await prisma.rehabTask.update({
      where: { id: task.id },
      data: {
        completedDates,
        progress,
        status: isCompleted ? "COMPLETED" : "ASSIGNED",
        completedAt: isCompleted ? task.completedAt ?? new Date() : null,
        caregiverMarkedDoneAt: isCompleted
          ? task.caregiverMarkedDoneAt ?? new Date()
          : null,
      },
      include: {
        provider: {
          select: {
            id: true,
            user: {
              select: { fullName: true, phoneNumber: true },
            },
            profession: true,
            facilityName: true,
          },
        },
        referral: {
          select: { id: true, status: true },
        },
      },
    });

    // Notify provider when caregiver marks task day as done
    try {
      const providerUserId = updatedTask.provider?.user?.id;
      if (providerUserId) {
        await NotificationService.createNotification({
          userId: providerUserId,
          type: "IN_APP",
          category: "TASK_REMINDER",
          title: isCompleted ? "Rehab Task Completed" : "Rehab Task Progress Updated",
          content: isCompleted
            ? "A rehab task for your patient has been marked as completed by the caregiver."
            : "A rehab task for your patient has new progress marked by the caregiver.",
          relatedId: updatedTask.id,
          relatedModel: "RehabTask",
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        });
      }
    } catch (e) {
      console.error("[Notification] Rehab task progress notification failed:", e.message);
    }

    // Record adherence log entry for this day
    try {
      const logDate = new Date(completionDate);
      logDate.setHours(0, 0, 0, 0);
      await prisma.taskAdherenceLog.upsert({
        where: { taskId_logDate: { taskId: task.id, logDate } },
        update: {
          status: "COMPLETED",
          markedById: userId,
          markedAt: new Date(),
        },
        create: {
          taskId: task.id,
          patientId,
          providerId: updatedTask.providerId,
          logDate,
          status: "COMPLETED",
          markedById: userId,
          markedAt: new Date(),
        },
      });
    } catch (e) {
      WRITE.warn("[Adherence] TaskAdherenceLog upsert failed", {
        taskId: task.id,
        err: e.message,
      });
    }

    return updatedTask;
  }
}



export default CpPatientService;
