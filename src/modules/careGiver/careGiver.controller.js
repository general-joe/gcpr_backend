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
}

export default CareGiverController;