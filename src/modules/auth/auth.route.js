import express from "express";
import rateLimit from "express-rate-limit";
import authController from "./auth.controller.js";
import { validate } from "../../middlewares/validation.js";
import { signUpSchema } from "./signUp.validator.js";
import upload from "../../middlewares/upload.js";

const authRouter = express.Router();


authRouter.post(
  "/register",
  upload.fields([{ name: "profileImage" }]),
  validate(signUpSchema),
  authController.registerUser,
);
authRouter.post("/verify-otp",  authController.verifyOtp);
authRouter.post("/resend-otp",  authController.resendOtp);
authRouter.post("/login",  authController.login);

authRouter.post(
  "/forgot-password",
  
  authController.forgotPassword,
);

authRouter.post(
  "/reset-password",
  
  authController.resetPassword,
);

authRouter.post("/refresh-token",  authController.refreshToken);

export default authRouter;
