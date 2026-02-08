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
      "Service provider profile completed",
      completeProfile,
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
      "Service providers retrieved successfully",
      result,
    );
  });

  static getServiceProviderById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const serviceProvider =
      await ServiceProviderService.getServiceProviderById(id);

    if (!serviceProvider) {
      return UtilFunctions.outputError(res, "Service provider not found", 404);
    }

    UtilFunctions.outputSuccess(
      res,
      "Service provider retrieved successfully",
      serviceProvider,
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
      "Search results retrieved successfully",
      result,
    );
  });

  static updateServiceProvider = catchAsync(async (req, res) => {
    const { id } = req.params;

    const existingProvider =
      await ServiceProviderService.getServiceProviderById(id);
    if (!existingProvider) {
      return UtilFunctions.outputError(res, "Service provider not found", 404);
    }

    const updatedServiceProvider =
      await ServiceProviderService.updateServiceProvider(
        id,
        req.body,
        req.files || {},
      );
    UtilFunctions.outputSuccess(
      res,
      "Service provider updated successfully",
      updatedServiceProvider,
    );
  });

  static deleteServiceProvider = catchAsync(async (req, res) => {
    const { id } = req.params;

    const existingProvider =
      await ServiceProviderService.getServiceProviderById(id);
    if (!existingProvider) {
      return UtilFunctions.outputError(res, "Service provider not found", 404);
    }

    await ServiceProviderService.deleteServiceProvider(id);
    UtilFunctions.outputSuccess(res, "Service provider deleted successfully");
  });
}
