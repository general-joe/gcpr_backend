import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import AssessmentService from "./assessment.service.js";

class AssessmentController {
  static submitAssessment = catchAsync(async (req, res) => {
    const user = req.user;
    const payload = req.body;

    const result = await AssessmentService.submitAssessment(user, payload);

    UtilFunctions.outputSuccess(
      res,
      "Assessment submitted successfully",
      result
    );
  });
}

export default AssessmentController;
