import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import AssessmentService from "./assessment.service.js";

class AssessmentController {
  static submitAssessment = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const payload = req.body;

    const result = await AssessmentService.submitAssessment(user, payload);

    UtilFunctions.outputSuccess(
      res,
      "Assessment submitted successfully",
      result
    );
  });

  static getAssessmentReport = catchAsync(async (req, res) => {
    const { assessmentId } = req.params;
    const result = await AssessmentService.getAssessmentReport(assessmentId);

    UtilFunctions.outputSuccess(
      res,
      "Clinical assessment report retrieved successfully",
      result
    );
  });

  static getAssessmentReportsByPatient = catchAsync(async (req, res) => {
    const { patientId } = req.params;
    const result = await AssessmentService.getAssessmentReportsByPatient(patientId);

    UtilFunctions.outputSuccess(
      res,
      "Patient assessment reports retrieved successfully",
      result
    );
  });
}

export default AssessmentController;
