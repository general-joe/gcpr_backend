import _ from "lodash";
import UtilFunctions from "../../utils/UtilFunctions.js";
import CareGiverService  from "./careGiver.service.js";
import catchAsync from "../../middlewares/catchAsync.js";

class CareGiverController {
  static completeProfile = catchAsync(async (req, res) => {
    const userId = res.locals.user.id;

    // GROUP caregivers must upload verification documents
    if (req.body.type === "GROUP") {
      if (!_.has(req.files, "verificationDocuments")) {
        return UtilFunctions.outputError(
          res,
          "Verification documents are required for group caregivers"
        );
      }
    }

    const caregiverData = {
      ...req.body,
      userId: req.body.type === "INDIVIDUAL" ? userId : null,
    };

    const result = await CareGiverService.completeProfile(req, caregiverData);

    UtilFunctions.outputSuccess(
      res,
      result,
      "Caregiver profile completed successfully"
    );
  });

 static getCareGivers = catchAsync(async (req, res) => {
    const { page, limit, search } = req.query;

    const result = await CareGiverService.fetchCareGivers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search: search || null,
    });

    UtilFunctions.outputSuccess(
      res,
      result,
      "Caregivers fetched successfully"
    );
  });

  static getCareGiverById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await CareGiverService.fetchCareGiverById(id);

    if (!result) {
      return UtilFunctions.outputError(res, "Caregiver not found", 404);
    }

    UtilFunctions.outputSuccess(
      res,
      result,
      "Caregiver profile fetched successfully"
    );
  });

  static updateCareGiverProfile = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = res.locals.user.id;

    // Ensure caregiver exists and belongs to the user (for INDIVIDUAL)
    const existingCareGiver = await CareGiverService.fetchCareGiverById(id);
    if (!existingCareGiver) {
      return UtilFunctions.outputError(res, "Caregiver not found", 404);
    }
    if (existingCareGiver.type === "INDIVIDUAL" && existingCareGiver.userId !== userId) {
      return UtilFunctions.outputError(res, "Unauthorized to update this caregiver profile", 403);
    }

    const updatedData = {
      ...req.body,
      userId: existingCareGiver.type === "INDIVIDUAL" ? userId : null,
    };

    const result = await CareGiverService.updateProfile(id, req, updatedData);

    UtilFunctions.outputSuccess(
      res,
      result,
      "Caregiver profile updated successfully"
    );
  });

  static deleteCareGiverProfile = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = res.locals.user.id;

    // Ensure caregiver exists and belongs to the user (for INDIVIDUAL)
    const existingCareGiver = await CareGiverService.fetchCareGiverById(id);
    if (!existingCareGiver) {
      return UtilFunctions.outputError(res, "Caregiver not found", 404);
    }
    if (existingCareGiver.type === "INDIVIDUAL" && existingCareGiver.userId !== userId) {
      return UtilFunctions.outputError(res, "Unauthorized to delete this caregiver profile", 403);
    }

    await CareGiverService.deleteProfile(id);

    UtilFunctions.outputSuccess(
      res,
      null,
      "Caregiver profile deleted successfully"
    );
  });

  
}

export default CareGiverController;
