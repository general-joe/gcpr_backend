import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { caregiverDashboard, providerDashboard } from "./dashboard.controller.js";

const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

router.get("/caregiver", limiter, authorize(["CAREGIVER"]), caregiverDashboard);
router.get("/provider", limiter, authorize(["SERVICE_PROVIDER"]), providerDashboard);

export default router;
