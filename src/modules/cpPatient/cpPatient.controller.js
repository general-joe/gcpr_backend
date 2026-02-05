import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import CpPatientService from "./cpPatient.service.js";

class CpPatientController {
  static createPatient = catchAsync(async (req, res) => {
    const data = req.body;
    const result = await CpPatientService.createPatient(data);
    UtilFunctions.outputSuccess(res, "CP patient created successfully", result);
  });

}

export default CpPatientController;
