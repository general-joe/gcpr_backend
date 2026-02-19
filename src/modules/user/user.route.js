import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import UserController from "./user.controller.js";

const userRouter = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});

userRouter.get(
  "/profile",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  authRateLimiter,
  UserController.getProfile,
);

export default userRouter;
