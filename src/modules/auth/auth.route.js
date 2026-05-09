import express from "express";
import rateLimit from "express-rate-limit";
import authController from "./auth.controller.js";
import { validate } from "../../middlewares/validation.js";
import { signUpSchema } from "./signUp.validator.js";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resendOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "./auth.validator.js";
import upload from "../../middlewares/upload.js";

const authRouter = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: {
    status: "error",
    message: "Too many login attempts from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});



authRouter.post(
  "/register",
  upload.fields([{ name: "profileImage" }]),
  validate(signUpSchema),
  authController.registerUser,
);
authRouter.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);
authRouter.post("/resend-otp", validate(resendOtpSchema), authController.resendOtp);
authRouter.post("/login",  validate(loginSchema), authController.login);

authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);

authRouter.post(
  "/refresh-token",
  authRateLimiter,
  validate(refreshTokenSchema),
  authController.refreshToken,
);

export default authRouter;
