import { Router } from "express";
import {
  getCarePlan,
  listCarePlans,
  generateCarePlan,
  updateCarePlanStatus,
  updateCarePlanContent,
} from "./carePlan.controller.js";
import { authorize } from "../../middlewares/auth.js";

const router = Router();

router.use(authorize(["SERVICE_PROVIDER", "ADMIN", "CAREGIVER"]));

router.post(
  "/generate/:assessmentId",
  authorize(["SERVICE_PROVIDER", "ADMIN"]),
  generateCarePlan,
);

router.get(
  "/",
  getCarePlan,
);

router.get(
  "/list",
  listCarePlans,
);

router.patch(
  "/:carePlanId/status",
  authorize(["SERVICE_PROVIDER", "ADMIN"]),
  updateCarePlanStatus,
);

router.patch(
  "/:carePlanId/content",
  authorize(["SERVICE_PROVIDER", "ADMIN"]),
  updateCarePlanContent,
);

export default router;
