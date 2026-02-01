import express from 'express';
import rateLimit from 'express-rate-limit';
import authController from './auth.controller.js';
import { validate } from '../../middlewares/validation.js';
import {signUpSchema} from './signUp.validator.js';
import upload from '../../middlewares/upload.js';

const authRouter = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 authentication requests per windowMs
  message: {
    status: 'error',
    message: 'Too many authentication requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post('/register', upload.fields([{name:'profileImage'}]) , validate(signUpSchema), authController.registerUser);
authRouter.post('/verify-otp', authRateLimiter, authController.verifyOtp);
export default authRouter;