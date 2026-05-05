import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import FunctionalClassificationService from "./functionalClassification.service.js";

class FunctionalClassificationController {
  static create = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const payload = req.validatedData ?? req.body;
    const result = await FunctionalClassificationService.create(user, payload);
    UtilFunctions.outputSuccess(
      res,
      result,
      "Functional classification recorded successfully",
      201
    );
  });

  static getByPatient = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const { patientId } = req.params;
    const query = req.query;
    const result = await FunctionalClassificationService.getByPatient(
      user,
      patientId,
      query
    );
    UtilFunctions.outputSuccess(
      res,
      result,
      "Functional classifications retrieved successfully"
    );
  });

  static getOne = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const { id } = req.params;
    const result = await FunctionalClassificationService.getOne(user, id);
    UtilFunctions.outputSuccess(
      res,
      result,
      "Functional classification retrieved successfully"
    );
  });

  static update = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const { id } = req.params;
    const payload = req.validatedData ?? req.body;
    const result = await FunctionalClassificationService.update(
      user,
      id,
      payload
    );
    UtilFunctions.outputSuccess(
      res,
      result,
      "Functional classification updated successfully"
    );
  });

  static delete = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const { id } = req.params;
    const result = await FunctionalClassificationService.delete(user, id);
    UtilFunctions.outputSuccess(
      res,
      result,
      "Functional classification deleted successfully"
    );
  });

  static getProgressSummary = catchAsync(async (req, res) => {
    const user = res.locals.user;
    const { patientId } = req.params;
    const result = await FunctionalClassificationService.getProgressSummary(
      user,
      patientId
    );
    UtilFunctions.outputSuccess(
      res,
      result,
      "Patient functional classification summary retrieved"
    );
  });
}

export default FunctionalClassificationController;
