import express from "express";
import rateLimit from "express-rate-limit";
import ServiceProviderController from "./serviceProvider.controller.js";
import { validate } from "../../middlewares/validation.js";
import { serviceProviderProfileSchema } from "./serviceProvider.validator.js";
import upload from "../../middlewares/upload.js";
import {authorize} from "../../middlewares/auth.js"

const serviceProviderRouter = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 authentication requests per windowMs
  message: {
    status: "error",
    message:
      "Too many authentication requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

serviceProviderRouter.post(
  "/complete-profile",
  authorize(["SERVICE_PROVIDER"]),
  upload.fields([{ name: "licenseImage" }]),
  validate(serviceProviderProfileSchema),
  authRateLimiter,
  
  ServiceProviderController.completeProfile,
);

export default serviceProviderRouter;
