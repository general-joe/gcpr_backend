import express from "express";
const router = express.Router();
import authRouter from "../modules/auth/auth.route.js";
import serviceProviderRouter from "../modules/serviceProvider/serviceProvider.route.js";
import caregiverRouter from "../modules/careGiver/careGiver.route.js";

router.use("/auth", authRouter);
router.use("/service-provider", serviceProviderRouter);
router.use("/caregiver", caregiverRouter);

export default router;
