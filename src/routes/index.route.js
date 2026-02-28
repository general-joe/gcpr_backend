import express from "express";
const router = express.Router();
import authRouter from "../modules/auth/auth.route.js";
import serviceProviderRouter from "../modules/serviceProvider/serviceProvider.route.js";
import caregiverRouter from "../modules/careGiver/careGiver.route.js";
import cpPatientRouter from "../modules/cpPatient/cpPatient.routes.js";
import assessmentRouter from "../modules/assessment/assessment.route.js";
import userRouter from "../modules/user/user.route.js";
import scheduleAppointmentRouter from "../modules/scheduleAppointment/scheduleAppointment.routes.js";


router.use("/auth", authRouter);
router.use("/service-provider", serviceProviderRouter);
router.use("/caregiver", caregiverRouter);
router.use("/cp-patient", cpPatientRouter);
router.use("/assessment", assessmentRouter);
router.use("/user", userRouter);
router.use("/schedule-appointment", scheduleAppointmentRouter);

export default router;
