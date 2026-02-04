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
}

export default CareGiverService;