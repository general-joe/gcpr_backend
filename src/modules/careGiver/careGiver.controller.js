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
      "Caregiver profile completed successfully",
      result
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
      "Caregivers fetched successfully",
      result
    );
  });
}

export default CareGiverController;