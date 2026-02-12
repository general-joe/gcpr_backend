import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";

class CpPatientService {
  static async createPatient(data) {
    if (!data) {
      throw new Error("Request body is missing");
    }

    const dateOfBirth = new Date(data.dateOfBirth);

    if (isNaN(dateOfBirth.getTime())) {
      throw new Error("Invalid dateOfBirth");
    }

    const age =
      new Date().getFullYear() - dateOfBirth.getFullYear();

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
        caregiverId: data.caregiverId,
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
        "Caregiver profile not found for this user"
      );
    }

    const patients = await prisma.cpPatient.findMany({
      where: { 
        caregiverId: caregiver.id 
      },
      orderBy: { createdAt: "desc" },
    });

    return patients;
  }
}

export default CpPatientService;
