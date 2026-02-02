import express from "express";
const router = express.Router();
import authRouter from "../modules/auth/auth.route.js";
import serviceProviderRouter from "../modules/serviceProvider/serviceProvider.route.js";

router.use("/auth", authRouter);
router.use("/service-provider", serviceProviderRouter);

export default router;
