import UtilFunctions from "../../utils/UtilFunctions.js";
import { ServiceProviderService } from "./serviceProvider.service.js";
import catchAsync from "../../middlewares/catchAsync.js";

export default class ServiceProviderController {
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

    const result = await ServiceProviderService.getAllServiceProviders(
      page,
      limit,
    );
    UtilFunctions.outputSuccess(
      res,
      result,
      "Service providers retrieved successfully",
    );
  });

  static getServiceProviderById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const serviceProvider =
      await ServiceProviderService.getServiceProviderById(id);

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

    const result = await ServiceProviderService.searchServiceProviders(
      search,
      filters,
      page,
      limit,
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

    const requester = await ServiceProviderService.getServiceProviderByUserId(
      requesterId
    );
    if (!requester || requester.id !== id) {
      return UtilFunctions.outputError(
        res,
        "You can only delete your own service provider profile",
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

    await ServiceProviderService.deleteServiceProvider(id);
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
}
