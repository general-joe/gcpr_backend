import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import AssessmentService from "./assessment.service.js";

class AssessmentController {
  static getAvailableTools = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const result = await AssessmentService.getAvailableTools(user);

    UtilFunctions.outputSuccess(
      res,
      result,
      "Assessment tools retrieved successfully"
    );
  });

  static getAssessmentFormByToolCode = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const { toolCode } = req.params;
    const result = await AssessmentService.getAssessmentFormByToolCode(user, toolCode);

    UtilFunctions.outputSuccess(
      res,
      result,
      "Assessment form schema retrieved successfully"
    );
  });

  static submitAssessment = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const payload = req.validatedData ?? req.body;

    const result = await AssessmentService.submitAssessment(user, payload);

    UtilFunctions.outputSuccess(
      res,
      result,
      "Assessment submitted successfully"
    );
  });

  static getAssessmentReport = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const { assessmentId } = req.params;
    const result = await AssessmentService.getAssessmentReport(user, assessmentId);

    UtilFunctions.outputSuccess(
      res,
      result,
      "Clinical assessment report retrieved successfully"
    );
  });

  static getAssessmentReportsByPatient = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const { patientId } = req.params;
    const result = await AssessmentService.getAssessmentReportsByPatient(user, patientId);

    UtilFunctions.outputSuccess(
      res,
      result,
      "Patient assessment reports retrieved successfully"
    );
  });

  static getIncomingReferrals = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const result = await AssessmentService.getIncomingReferrals(user);
    UtilFunctions.outputSuccess(res, result, "Incoming referrals retrieved successfully");
  });

  static getOutgoingReferrals = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const result = await AssessmentService.getOutgoingReferrals(user);
    UtilFunctions.outputSuccess(res, result, "Outgoing referrals retrieved successfully");
  });

  static createReferral = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const payload = req.validatedData ?? req.body;
    const result = await AssessmentService.createReferral(user, payload);
    UtilFunctions.outputSuccess(res, result, "Referral created successfully");
  });

  static updateReferralStatus = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const { referralId } = req.params;
    const { status } = req.validatedData ?? req.body;
    const result = await AssessmentService.updateReferralStatus(user, referralId, status);
    UtilFunctions.outputSuccess(res, result, "Referral status updated successfully");
  });

  static createRehabTaskFromReferral = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const { referralId } = req.params;
    const payload = req.validatedData ?? req.body;
    const result = await AssessmentService.createRehabTaskFromReferral(
      user,
      referralId,
      payload
    );
    UtilFunctions.outputSuccess(res, result, "Rehab task assigned successfully");
  });

  static getMyAssignedTasks = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const result = await AssessmentService.getMyAssignedTasks(user);
    UtilFunctions.outputSuccess(res, result, "Assigned rehab tasks retrieved successfully");
  });

  static updateTaskProgress = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const { taskId } = req.params;
    const { progress } = req.validatedData ?? req.body;
    const result = await AssessmentService.updateTaskProgress(user, taskId, progress);
    UtilFunctions.outputSuccess(res, result, "Task progress updated successfully");
  });
}

export default AssessmentController;
