import { Router } from "express";
import {
  getCarePlan,
  listCarePlans,
  generateCarePlan,
  updateCarePlan,
} from "./carePlan.controller.js";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import { generateCarePlanParamsSchema } from "./carePlan.validator.js";

const router = Router();

router.use(authorize(["SERVICE_PROVIDER", "ADMIN", "CAREGIVER"]));

router.post(
  "/generate/:assessmentId",
  authorize(["SERVICE_PROVIDER", "ADMIN"]),
  validate(generateCarePlanParamsSchema, "params"),
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
  "/:carePlanId",
  authorize(["SERVICE_PROVIDER", "ADMIN"]),
  updateCarePlan,
);

export default router;
