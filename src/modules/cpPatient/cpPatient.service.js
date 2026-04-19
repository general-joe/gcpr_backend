import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import NotificationService from "../notification/notification.service.js";

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

    return patient;
  }

  static async fetchPatients(userId) {
    const caregiver = await CpPatientService.requireCaregiver(userId);

    const patients = await prisma.cpPatient.findMany({
      where: {
        caregiverId: caregiver.id,
      },
      orderBy: { createdAt: "desc" },
    });

    return patients;
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

    return updatedTask;
  }
}



export default CpPatientService;
