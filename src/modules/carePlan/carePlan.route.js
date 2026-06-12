import { Router } from "express";
import {
  getCarePlan,
  listCarePlans,
  generateCarePlan,
  updateCarePlanStatus,
  updateCarePlanContent,
} from "./carePlan.controller.js";
import { authorize, requireRbacRole } from "../../middlewares/auth.js";

const router = Router();

router.use(authorize(["SERVICE_PROVIDER", "ADMIN"]));

router.post(
  "/care-plan/generate/:assessmentId",
  requireRbacRole(["ADMIN", "CLINICAL_REVIEWER", "PROVIDER"]),
  generateCarePlan,
);

router.get(
  "/care-plan",
  requireRbacRole(["ADMIN", "CLINICAL_REVIEWER", "PROVIDER"]),
  getCarePlan,
);

router.get(
  "/care-plan/list",
  requireRbacRole(["ADMIN", "CLINICAL_REVIEWER", "PROVIDER"]),
  listCarePlans,
);

router.patch(
  "/care-plan/:carePlanId/status",
  requireRbacRole(["ADMIN", "CLINICAL_REVIEWER", "PROVIDER"]),
  updateCarePlanStatus,
);

router.patch(
  "/care-plan/:carePlanId/content",
  requireRbacRole(["ADMIN", "CLINICAL_REVIEWER", "PROVIDER"]),
  updateCarePlanContent,
);

export default router;
