import prisma from "../../config/database.js";

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
}


export default CpPatientService;
