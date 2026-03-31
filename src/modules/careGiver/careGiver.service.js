import prisma from "../../config/database.js";
import UploadService from "../../utils/uploadService.js";
import constants from "../../utils/constants.js";

 class CareGiverService {
  static async completeProfile(req, caregiverData) {
    // Handle GROUP verification documents upload
    if (
      caregiverData.type === "GROUP" &&
      _.has(req.files, "verificationDocuments")
    ) {
      const uploadedDocs = [];

      for (const file of req.files.verificationDocuments) {
        const fileName = `caregiver-${Date.now()}-${file.originalname}`;
        const fileUrl = await UploadService.saveFile(
          file.buffer,
          fileName,
          constants.VERIFICATION_BUCKET
        );
        uploadedDocs.push(fileUrl);
      }

      caregiverData.verificationDocuments = uploadedDocs;
    }

    // Create caregiver profile
    const caregiver = await prisma.careGiver.create({
      data: {
        type: caregiverData.type,

        // INDIVIDUAL
        occupation: caregiverData.occupation,
        educationLevel: caregiverData.educationLevel,
        idType: caregiverData.idType,
        idNumber: caregiverData.idNumber,
        userId: caregiverData.userId,

        // GROUP
        nameOfGroup: caregiverData.nameOfGroup,
        locationOfGroup: caregiverData.locationOfGroup,
        groupContact: caregiverData.groupContact,
        groupDigitalAddress: caregiverData.groupDigitalAddress,
        groupEmail: caregiverData.groupEmail,
        ManagerName: caregiverData.ManagerName,
        managerContact: caregiverData.managerContact,
        verificationDocuments: caregiverData.verificationDocuments || [],
      },
    });

    // Mark user profile as completed
    if (caregiverData.userId) {
      await prisma.user.update({
        where: { id: caregiverData.userId },
        data: { profileCompleted: true },
      });
    }

    return caregiver;
  }



  static async fetchCareGivers({ page = 1, limit = 10, search = null }) {
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { occupation: { contains: search, mode: "insensitive" } },
        { nameOfGroup: { contains: search, mode: "insensitive" } },
        {
          user: {
            is: {
              fullName: { contains: search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const rows = await prisma.careGiver.findMany({
      where,
      include: {
        //  FIX: include linked user
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            gender: true,
            verified: true,
            profileCompleted: true,
            createdAt: true,
          },
        },

        //  FIX: include CP patients
        cpPatients: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const careGivers = rows.map((u) => ({
      id: u.id,
      type: u.type,

      // INDIVIDUAL
      occupation: u.occupation,
      educationLevel: u.educationLevel,
      idType: u.idType,
      idNumber: u.idNumber,

      // GROUP
      nameOfGroup: u.nameOfGroup,
      locationOfGroup: u.locationOfGroup,
      groupContact: u.groupContact,
      groupDigitalAddress: u.groupDigitalAddress,
      groupEmail: u.groupEmail,
      ManagerName: u.ManagerName,
      managerContact: u.managerContact,
      verificationDocuments: u.verificationDocuments,

      //  FIXED RETURNS
      user: u.user,              // null for GROUP
      cpPatients: u.cpPatients,  // [] if none

      createdAt: u.createdAt,
    }));

    const total = await prisma.careGiver.count({ where });

    return {
      careGivers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

export default CareGiverService;