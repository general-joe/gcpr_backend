import prisma from "../../config/database.js";

import UploadService from "../../utils/uploadService.js";
import constants from "../../utils/constants.js";

export class ServiceProviderService {
  static async completeProfile(rq, serviceProviderData) {
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
    const completeProfile = await prisma.serviceProvider.create({
      data: {
        ...serviceProviderData,
        experience: Number(rq.body.experience),
        licenseExpiry: new Date(rq.body.licenseExpiry),
        licenseIssuedDate: new Date(rq.body.licenseIssuedDate),
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

    return completeProfile;
  }

  static async getAllServiceProviders(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [serviceProviders, total] = await Promise.all([
      prisma.serviceProvider.findMany({
        skip,
        take: limit,
        include: {
          user: true,
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
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getServiceProviderById(id) {
    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    return serviceProvider;
  }

  static async searchServiceProviders(
    searchTerm,
    filters = {},
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;

    const whereConditions = {
      OR: [
        { licenseNumber: { contains: searchTerm, mode: "insensitive" } },
        { profession: { contains: searchTerm, mode: "insensitive" } },
        { facilityName: { contains: searchTerm, mode: "insensitive" } },
        { facilityAddress: { contains: searchTerm, mode: "insensitive" } },
        { user: { firstName: { contains: searchTerm, mode: "insensitive" } } },
        { user: { lastName: { contains: searchTerm, mode: "insensitive" } } },
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
          user: true,
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
        pages: Math.ceil(total / limit),
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

    const updatedServiceProvider = await prisma.serviceProvider.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });

    return updatedServiceProvider;
  }

  static async deleteServiceProvider(id) {
    const deletedServiceProvider = await prisma.serviceProvider.delete({
      where: { id },
    });

    return deletedServiceProvider;
  }
}
