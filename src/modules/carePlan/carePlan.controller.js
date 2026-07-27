import CarePlanService from "../../services/clinical/carePlan.service.js";
import HttpStatus from "../../utils/http-status.js";
import catchAsync from "../../middlewares/catchAsync.js";

const getCarePlan = catchAsync(async (req, res) => {
  const patientId = req.query.patientId;
  const carePlan = await CarePlanService.getCarePlan(res.locals.user, patientId);

  if (!carePlan) {
    return res.status(HttpStatus.NOT_FOUND).json({ message: "Care plan not found" });
  }

  return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, data: carePlan });
});

const listCarePlans = catchAsync(async (req, res) => {
  const patientId = req.query.patientId;
  const carePlans = await CarePlanService.listCarePlans(res.locals.user, patientId);

  return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, data: carePlans });
});

const generateCarePlan = catchAsync(async (req, res) => {
  const { assessmentId } = req.params;

  const carePlan = await CarePlanService.generateFromAssessment(res.locals.user, assessmentId);

  return res.status(HttpStatus.CREATED).json({ status: HttpStatus.CREATED, data: carePlan });
});

const updateCarePlan = catchAsync(async (req, res) => {
  const { carePlanId } = req.params;
  const payload = req.body;

  const carePlan = await CarePlanService.updateCarePlan(res.locals.user, carePlanId, payload);

  return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, data: carePlan });
});

export { getCarePlan, listCarePlans, generateCarePlan, updateCarePlan };
