import express from "express";
const router = express.Router();
import authRouter from "../modules/auth/auth.route.js";
import serviceProviderRouter from "../modules/serviceProvider/serviceProvider.route.js";
import caregiverRouter from "../modules/careGiver/careGiver.route.js";
import cpPatientRouter from "../modules/cpPatient/cpPatient.routes.js";
import assessmentRouter from "../modules/assessment/assessment.route.js";
import userRouter from "../modules/user/user.route.js";
import scheduleAppointmentRouter from "../modules/scheduleAppointment/scheduleAppointment.routes.js";
import communityRouter from "../modules/community/community.route.js";
import communityGroupRouter from "../modules/community/communityGroup.route.js";
import communityAnnouncementRouter from "../modules/community/communityAnnouncement.route.js";
import directMessageRouter from "../modules/directMessage/directMessage.route.js";
import resourceRouter from "../modules/resource/resource.route.js";
import notificationRouter from "../modules/notification/notification.route.js";


router.use("/auth", authRouter);
router.use("/service-provider", serviceProviderRouter);
router.use("/caregiver", caregiverRouter);
router.use("/cp-patient", cpPatientRouter);
router.use("/assessment", assessmentRouter);
router.use("/user", userRouter);
router.use("/schedule-appointment", scheduleAppointmentRouter);
router.use("/community", communityRouter);
router.use("/community/:communityId/groups", communityGroupRouter);
router.use("/community/:communityId/announcements", communityAnnouncementRouter);
router.use("/direct-message", directMessageRouter);
router.use("/resource", resourceRouter);
router.use("/notification", notificationRouter);


export default router;
