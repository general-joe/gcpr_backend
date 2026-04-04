import prisma from "../../config/database.js";
import UploadService from "../../utils/uploadService.js";
import constants from "../../utils/constants.js";
import { getIO } from "../../socket.io.js";
import _ from "lodash";

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
        managerName: caregiverData.managerName,
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

    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user-${caregiverData.userId}`).emit('caregiver-profile-updated', {
        type: 'PROFILE_COMPLETED',
        caregiverId: caregiver.id
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
      managerName: u.managerName,
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

  static async getCareGiverById(careGiverId) {
    const caregiver = await prisma.careGiver.findUnique({
      where: { id: careGiverId },
      include: {
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
        cpPatients: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return caregiver;
  }

  static async getCareGiversByUserId(userId) {
    const caregivers = await prisma.careGiver.findMany({
      where: { userId },
      include: {
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
        cpPatients: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return caregivers;
  }

    static async deleteCareGiver(careGiverId) {
    const caregiver = await prisma.careGiver.delete({
      where: { id: careGiverId },
    });

    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io && caregiver.userId) {
      io.to(`user-${caregiver.userId}`).emit('caregiver-profile-deleted', {
        type: 'PROFILE_DELETED',
        caregiverId: careGiverId
      });
    }

    return caregiver;
    }

    static async updateCareGiver(careGiverId, updateData) {
    const caregiver = await prisma.careGiver.update({
      where: { id: careGiverId },
      data: updateData,
    });

    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io && caregiver.userId) {
      io.to(`user-${caregiver.userId}`).emit('caregiver-profile-updated', {
        type: 'PROFILE_UPDATED',
        caregiverId: caregiver.id
      });
    }

    return caregiver; 
  }

  // Aliases for controller compatibility
  static fetchCareGiverById = CareGiverService.getCareGiverById;
  static updateProfile = (id, req, data) => CareGiverService.updateCareGiver(id, data);
  static deleteProfile = CareGiverService.deleteCareGiver;

}

export default CareGiverService;