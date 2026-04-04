import prisma from "../../config/database.js";

import UploadService from "../../utils/uploadService.js";
import constants from "../../utils/constants.js";
import { getIO } from "../../socket.io.js";
import _ from "lodash";

const SAFE_USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  gender: true,
  profileImage: true,
  verified: true,
  profileCompleted: true,
  createdAt: true
};

const getLicenseStatus = (issuedDate, expiryDate, now = new Date()) => {
  if (!issuedDate || !expiryDate) return "INACTIVE";
  if (issuedDate > now) return "INACTIVE";
  if (expiryDate < now) return "INACTIVE";
  return "ACTIVE";
};

export class ServiceProviderService {
  static async syncLicenseStatuses() {
    const now = new Date();

    await prisma.serviceProvider.updateMany({
      where: {
        licenseIssuedDate: { lte: now },
        licenseExpiry: { gte: now },
        NOT: { licenseStatus: "ACTIVE" }
      },
      data: { licenseStatus: "ACTIVE" }
    });

    await prisma.serviceProvider.updateMany({
      where: {
        OR: [{ licenseIssuedDate: { gt: now } }, { licenseExpiry: { lt: now } }],
        NOT: { licenseStatus: "INACTIVE" }
      },
      data: { licenseStatus: "INACTIVE" }
    });
  }

  static async completeProfile(rq, serviceProviderData) {
    const existingProfile = await prisma.serviceProvider.findUnique({
      where: { userId: serviceProviderData.userId },
      select: { id: true }
    });

    if (existingProfile) {
      throw new gcprError(409, "Service provider profile already exists");
    }

    if (!_.isEmpty(rq.files)) {
      if (_.has(rq.files, "licenseImage")) {
        const fileName = `${serviceProviderData.userId}.jpg`;
        console.log(fileName);
        serviceProviderData.licenseImage = await UploadService.saveFile(
          rq.files.licenseImage[0].buffer,
          fileName,
          constants.LICENSES_BUCKET,
        );
      }
    }
    const licenseExpiry = new Date(rq.body.licenseExpiry);
    const licenseIssuedDate = new Date(rq.body.licenseIssuedDate);
    const licenseStatus = getLicenseStatus(licenseIssuedDate, licenseExpiry);

    const completeProfile = await prisma.serviceProvider.create({
      data: {
        ...serviceProviderData,
        experience: Number(rq.body.experience),
        licenseExpiry,
        licenseIssuedDate,
        licenseStatus
      },
    });

    const updateUserProfileCompleteField = await prisma.user.update({
      where: {
        id: serviceProviderData.userId,
      },
      data: {
        profileCompleted: true,
      },
    });

    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user-${serviceProviderData.userId}`).emit('service-provider-profile-updated', {
        type: 'PROFILE_COMPLETED',
        serviceProviderId: completeProfile.id
      });
    }

    return completeProfile;
  }

  static async getAllServiceProviders(page = 1, limit = 10) {
    await ServiceProviderService.syncLicenseStatuses();

    const skip = (page - 1) * limit;
    const [serviceProviders, total] = await Promise.all([
      prisma.serviceProvider.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: SAFE_USER_SELECT
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.serviceProvider.count(),
    ]);

    return {
      data: serviceProviders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getServiceProviderById(id) {
    await ServiceProviderService.syncLicenseStatuses();

    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { id },
      include: {
        user: {
          select: SAFE_USER_SELECT
        },
        availabilities: true,
      },
    });

    return serviceProvider;
  }

  static async getServiceProviderByUserId(userId) {
    return prisma.serviceProvider.findUnique({
      where: { userId },
      select: { id: true, userId: true, profession: true }
    });
  }

  static async searchServiceProviders(
    searchTerm,
    filters = {},
    page = 1,
    limit = 10,
  ) {
    await ServiceProviderService.syncLicenseStatuses();

    const skip = (page - 1) * limit;

    const whereConditions = {
      OR: [
        { licenseNumber: { contains: searchTerm, mode: "insensitive" } },
        { facilityName: { contains: searchTerm, mode: "insensitive" } },
        { facilityAddress: { contains: searchTerm, mode: "insensitive" } },
        { user: { fullName: { contains: searchTerm, mode: "insensitive" } } },
      ],
    };

    if (filters.licenseType) {
      whereConditions.licenseType = filters.licenseType;
    }
    if (filters.profession) {
      whereConditions.profession = filters.profession;
    }
    if (filters.facilityType) {
      whereConditions.facilityType = filters.facilityType;
    }
    if (filters.licenseStatus) {
      whereConditions.licenseStatus = filters.licenseStatus;
    }

    const [results, total] = await Promise.all([
      prisma.serviceProvider.findMany({
        where: whereConditions,
        skip,
        take: limit,
        include: {
          user: {
            select: SAFE_USER_SELECT
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.serviceProvider.count({ where: whereConditions }),
    ]);

    return {
      data: results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async updateServiceProvider(id, updateData, files) {
    const data = { ...updateData };

    if (!_.isEmpty(files)) {
      if (_.has(files, "licenseImage")) {
        const fileName = `${id}.jpg`;
        data.licenseImage = await UploadService.saveFile(
          files.licenseImage[0].buffer,
          fileName,
          constants.LICENSES_BUCKET,
        );
      }
    }

    if (updateData.experience !== undefined) {
      data.experience = Number(updateData.experience);
    }
    if (updateData.licenseExpiry !== undefined) {
      data.licenseExpiry = new Date(updateData.licenseExpiry);
    }
    if (updateData.licenseIssuedDate !== undefined) {
      data.licenseIssuedDate = new Date(updateData.licenseIssuedDate);
    }

    const hasLicenseDates =
      data.licenseIssuedDate !== undefined || data.licenseExpiry !== undefined;
    if (hasLicenseDates) {
      const currentProvider = await prisma.serviceProvider.findUnique({
        where: { id },
        select: { licenseIssuedDate: true, licenseExpiry: true }
      });

      if (currentProvider) {
        const nextIssuedDate = data.licenseIssuedDate ?? currentProvider.licenseIssuedDate;
        const nextExpiryDate = data.licenseExpiry ?? currentProvider.licenseExpiry;
        data.licenseStatus = getLicenseStatus(nextIssuedDate, nextExpiryDate);
      }
    }

    const updatedServiceProvider = await prisma.serviceProvider.update({
      where: { id },
      data,
      include: {
        user: {
          select: SAFE_USER_SELECT
        },
      },
    });

    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io && updatedServiceProvider.userId) {
      io.to(`user-${updatedServiceProvider.userId}`).emit('service-provider-profile-updated', {
        type: 'PROFILE_UPDATED',
        serviceProviderId: updatedServiceProvider.id
      });
    }

    return updatedServiceProvider;
  }

  static async updateAvailability(id, availability = []) {
    // availability: [{ dayOfWeek, startTime, endTime }, ...]
    // Replace existing availability for provider with new set
    const createData = availability.map((slot) => ({
      providerId: id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));

    await prisma.$transaction([
      prisma.providerAvailability.deleteMany({ where: { providerId: id } }),
      prisma.providerAvailability.createMany({ data: createData }),
    ]);

    const result = await prisma.providerAvailability.findMany({ where: { providerId: id }, orderBy: { dayOfWeek: 'asc' } });
    return result;
  }

  static async deleteServiceProvider(id) {
    const deletedServiceProvider = await prisma.serviceProvider.delete({
      where: { id },
    });

    // Emit real-time update via Socket.IO
    const io = getIO();
    if (io && deletedServiceProvider.userId) {
      io.to(`user-${deletedServiceProvider.userId}`).emit('service-provider-profile-deleted', {
        type: 'PROFILE_DELETED',
        serviceProviderId: id
      });
    }

    return deletedServiceProvider;
  }
}
