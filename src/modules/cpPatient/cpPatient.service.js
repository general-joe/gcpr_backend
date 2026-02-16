import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";

class CpPatientService {
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

    const age = new Date().getFullYear() - dateOfBirth.getFullYear();

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
        age,
        gender: data.gender,
        address: data.address,
        placeOfBirth: data.placeOfBirth,
        birthWeight: data.birthWeight,
        numberOfSiblings: data.numberOfSiblings,
        caregiverId: caregiver.id,
        relationToCaregiver: data.relationToCaregiver,
        householdSize: data.householdSize,
        schoolEnrollmmentStatus: data.schoolEnrollmmentStatus ?? false,
        typeOfSchool: data.typeOfSchool,
      },
    });

    return patient;
  }

  static async fetchPatients(userId) {
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

    const patients = await prisma.cpPatient.findMany({
      where: {
        caregiverId: caregiver.id,
      },
      orderBy: { createdAt: "desc" },
    });

    return patients;
  }

  static async getAssignedTasks(userId, patientId) {
    if (!userId) {
      throw new gcprError(HttpStatus.UNAUTHORIZED, "Unauthorized request");
    }

    if (!patientId) {
      throw new gcprError(HttpStatus.BAD_REQUEST, "Patient ID is required");
    }

    // Verify caregiver and patient relationship
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

    const patient = await prisma.cpPatient.findUnique({
      where: { id: patientId },
      select: { id: true, caregiverId: true, fullName: true },
    });

    if (!patient) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Patient not found");
    }

    if (patient.caregiverId !== caregiver.id) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You do not have access to this patient's tasks",
      );
    }

    // Fetch assigned tasks for the patient
    const tasks = await prisma.rehabTask.findMany({
      where: {
        patientId: patientId,
        status: "ASSIGNED",
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
}

export default CpPatientService;
