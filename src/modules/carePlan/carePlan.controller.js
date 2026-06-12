import CarePlanService from "../../services/clinical/carePlan.service.js";
import HttpStatus from "../../utils/http-status.js";
import { hasRbacRole } from "../../middlewares/auth.js";
import catchAsync from "../../middlewares/catchAsync.js";

const getCarePlan = catchAsync(async (req, res) => {
  const patientId = req.query.patientId;
  const carePlan = await CarePlanService.getCarePlan(req.user, patientId);

  if (!carePlan) {
    return res.status(HttpStatus.NOT_FOUND).json({ message: "Care plan not found" });
  }

  return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, data: carePlan });
});

const listCarePlans = catchAsync(async (req, res) => {
  const patientId = req.query.patientId;
  const carePlans = await CarePlanService.listCarePlans(req.user, patientId);

  return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, data: carePlans });
});

const generateCarePlan = catchAsync(async (req, res) => {
  const { assessmentId } = req.params;

  const carePlan = await CarePlanService.generateFromAssessment(req.user, assessmentId);

  return res.status(HttpStatus.CREATED).json({ status: HttpStatus.CREATED, data: carePlan });
});

const updateCarePlanStatus = catchAsync(async (req, res) => {
  const { carePlanId } = req.params;
  const { status } = req.body;

  const carePlan = await CarePlanService.updateCarePlanStatus(req.user, carePlanId, status);

  return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, data: carePlan });
});

const updateCarePlanContent = catchAsync(async (req, res) => {
  const { carePlanId } = req.params;
  const payload = req.body;

  const carePlan = await CarePlanService.updateCarePlanContent(req.user, carePlanId, payload);

  return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, data: carePlan });
});

export { getCarePlan, listCarePlans, generateCarePlan, updateCarePlanStatus, updateCarePlanContent };
