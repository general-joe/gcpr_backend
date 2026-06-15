import UtilFunctions from "../../utils/UtilFunctions.js";
import { ServiceProviderService } from "./serviceProvider.service.js";
import catchAsync from "../../middlewares/catchAsync.js";
import prisma from "../../config/database.js";

export default class ServiceProviderController {
  static createForAdmin = catchAsync(async (req, res) => {
    const userId = req.body.userId || res.locals.user.id;
    
    const existingProfile = await prisma.serviceProvider.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (existingProfile) {
      return UtilFunctions.outputError(
        res,
        "Service provider profile already exists for this user",
        {},
        "CONFLICT",
        409
      );
    }

    const licenseNumber = `ADMIN-${userId}-${Date.now()}`.trim();
    
    const completeProfile = await prisma.serviceProvider.create({
      data: {
        userId,
        licenseNumber,
        licenseStatus: "ACTIVE",
        licenseIssuedDate: new Date(),
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        experience: 0,
      },
    });

    UtilFunctions.outputSuccess(
      res,
      completeProfile,
      "Service provider profile created for admin",
    );
  });

  static completeProfile = catchAsync(async (req, res) => {
    if (!_.has(req.files, "licenseImage")) {
      return UtilFunctions.outputError(res, "No license image specified");
    }

    const serviceProviderData = {
      ...req.body,
      ...{ userId: res.locals.user.id },
    };
    const completeProfile = await ServiceProviderService.completeProfile(
      req,
      serviceProviderData,
    );
    UtilFunctions.outputSuccess(
      res,
      completeProfile,
      "Service provider profile completed",
    );
  });

  static getAllServiceProviders = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const requesterRole = res.locals.user?.userType;

    const result = await ServiceProviderService.getAllServiceProviders(
      page,
      limit,
      requesterRole,
    );
    UtilFunctions.outputSuccess(
      res,
      result,
      "Service providers retrieved successfully",
    );
  });

  static getServiceProviderById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const requesterRole = res.locals.user?.userType;
    const serviceProvider =
      await ServiceProviderService.getServiceProviderById(id, requesterRole);

    if (!serviceProvider) {
      return UtilFunctions.outputError(
        res,
        "Service provider not found",
        {},
        "NOT_FOUND",
        404
      );
    }

    UtilFunctions.outputSuccess(
      res,
      serviceProvider,
      "Service provider retrieved successfully",
    );
  });

  static searchServiceProviders = catchAsync(async (req, res) => {
    const { search } = req.query;
    if (!search) {
      return UtilFunctions.outputError(res, "Search term is required");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      licenseType: req.query.licenseType,
      profession: req.query.profession,
      facilityType: req.query.facilityType,
      licenseStatus: req.query.licenseStatus,
    };
    const requesterRole = res.locals.user?.userType;

    const result = await ServiceProviderService.searchServiceProviders(
      search,
      filters,
      page,
      limit,
      requesterRole,
    );
    UtilFunctions.outputSuccess(
      res,
      result,
      "Search results retrieved successfully",
    );
  });

  static updateServiceProvider = catchAsync(async (req, res) => {
    const requesterId = res.locals.user.id;
    const { id } = req.params;

    const requester = await ServiceProviderService.getServiceProviderByUserId(
      requesterId
    );
    if (!requester || requester.id !== id) {
      return UtilFunctions.outputError(
        res,
        "You can only update your own service provider profile",
        {},
        "FORBIDDEN",
        403
      );
    }

    const existingProvider =
      await ServiceProviderService.getServiceProviderById(id);
    if (!existingProvider) {
      return UtilFunctions.outputError(
        res,
        "Service provider not found",
        {},
        "NOT_FOUND",
        404
      );
    }

    const updatedServiceProvider =
      await ServiceProviderService.updateServiceProvider(
        id,
        req.body,
        req.files || {},
      );
    UtilFunctions.outputSuccess(
      res,
      updatedServiceProvider,
      "Service provider updated successfully",
    );
  });

  static deleteServiceProvider = catchAsync(async (req, res) => {
    const requesterId = res.locals.user.id;
    const { id } = req.params;
    const userType = res.locals.user.userType;

    // Look up the service provider - the id could be either a serviceProviderId or a userId
    let existingProvider =
      await ServiceProviderService.getServiceProviderById(id);

    // If not found by provider id, try looking up by userId
    if (!existingProvider) {
      existingProvider = await ServiceProviderService.getServiceProviderByUserId(id);
    }

    if (!existingProvider) {
      return UtilFunctions.outputError(
        res,
        "Service provider not found",
        {},
        "NOT_FOUND",
        404
      );
    }

    const providerId = existingProvider.id;

    // ADMIN can delete any service provider profile
    if (userType !== "ADMIN") {
      const requester = await ServiceProviderService.getServiceProviderByUserId(
        requesterId
      );
      if (!requester || requester.id !== providerId) {
        return UtilFunctions.outputError(
          res,
          "You can only delete your own service provider profile",
          {},
          "FORBIDDEN",
          403
        );
      }
    }

    await ServiceProviderService.deleteServiceProvider(providerId);
    UtilFunctions.outputSuccess(res, {}, "Service provider deleted successfully");
  });

  static updateAvailability = catchAsync(async (req, res) => {
    const requesterId = res.locals.user.id;
    const { id } = req.params;

    const requester = await ServiceProviderService.getServiceProviderByUserId(
      requesterId
    );
    if (!requester || requester.id !== id) {
      return UtilFunctions.outputError(
        res,
        "You can only update your own service provider availability",
        {},
        "FORBIDDEN",
        403
      );
    }

    const existingProvider =
      await ServiceProviderService.getServiceProviderById(id);
    if (!existingProvider) {
      return UtilFunctions.outputError(
        res,
        "Service provider not found",
        {},
        "NOT_FOUND",
        404
      );
    }

    const availability = req.body.availability;
    const updated = await ServiceProviderService.updateAvailability(
      id,
      availability,
    );

    UtilFunctions.outputSuccess(
      res,
      updated,
      "Service provider availability updated successfully",
    );
  });

  // ─── Admin verification actions ──────────────────────────────────────────

  static verifyProvider = catchAsync(async (req, res) => {
    const adminUserId = res.locals.user.id;
    const { id } = req.params;
    const { note } = req.body;
    const result = await ServiceProviderService.verifyServiceProvider(
      id,
      adminUserId,
      note
    );
    UtilFunctions.outputSuccess(res, result, "Service provider verified successfully");
  });

  static rejectProvider = catchAsync(async (req, res) => {
    const adminUserId = res.locals.user.id;
    const { id } = req.params;
    const { reason } = req.body;
    const result = await ServiceProviderService.rejectServiceProvider(
      id,
      adminUserId,
      reason
    );
    UtilFunctions.outputSuccess(res, result, "Service provider verification rejected");
  });

  static suspendProvider = catchAsync(async (req, res) => {
    const adminUserId = res.locals.user.id;
    const { id } = req.params;
    const { reason } = req.body;
    const result = await ServiceProviderService.suspendServiceProvider(
      id,
      adminUserId,
      reason
    );
    UtilFunctions.outputSuccess(res, result, "Service provider suspended");
  });

  static getPendingVerification = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await ServiceProviderService.getPendingVerification(page, limit);
    UtilFunctions.outputSuccess(res, result, "Pending verification list retrieved");
  });

  static getVerificationStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ServiceProviderService.getVerificationStatus(id);
    UtilFunctions.outputSuccess(res, result, "Verification status retrieved");
  });
}
