import UtilFunctions from "../../utils/UtilFunctions.js";
import AuthService from "./auth.service.js";
import catchAsync from "../../middlewares/catchAsync.js";
import constants from "../../utils/constants.js";

class AuthController {
  static registerUser = catchAsync(async (req, res) => {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userData = {
      ...req.body,
      id: UtilFunctions.genId(),
    };

    WRITE.debug("POST /register started", {
      requestId,
      email: userData.email,
      otpChannel: userData.otpChannel,
      timestamp: new Date().toISOString(),
    });

    const result = await AuthService.registerUser(req, userData);

    const message =
      result.otpChannel === constants.OTP_MODES.SMS
        ? "Registration successful. An OTP has been sent to your phone number."
        : "Registration successful. An OTP has been sent to your email address.";

    WRITE.info("POST /register completed successfully", {
      requestId,
      email: userData.email,
      otpChannel: result.otpChannel,
      timestamp: new Date().toISOString(),
    });

    return UtilFunctions.outputSuccess(res, {
      message,
      otpChannel: result.otpChannel,
    });
  });

  static verifyOtp = catchAsync(async (req, res) => {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { identifier, otp } = req.body;

    WRITE.debug("POST /verify-otp started", {
      requestId,
      identifier,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    const result = await AuthService.verifyOtp(identifier, otp);

    WRITE.info("POST /verify-otp completed successfully", {
      requestId,
      userId: result.user?.id,
      timestamp: new Date().toISOString(),
    });

    return UtilFunctions.outputSuccess(res, {
      message: "Account verified successfully",
      ...result,
    });
  });

  static login = catchAsync(async (req, res) => {
    const { identifier, password } = req.body;

    const result = await AuthService.loginUser(identifier, password);

    return UtilFunctions.outputSuccess(res, {
      message: "Login successful",
      ...result,
    });
  });

  static forgotPassword = catchAsync(async (req, res) => {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { identifier } = req.body;

    WRITE.debug("POST /forgot-password started", {
      requestId,
      identifier,
      timestamp: new Date().toISOString(),
    });

    await AuthService.forgotPassword(identifier);

    WRITE.info("POST /forgot-password completed successfully", {
      requestId,
      identifier,
      timestamp: new Date().toISOString(),
    });

    return UtilFunctions.outputSuccess(res, "OTP sent");
  });

  static resetPassword = catchAsync(async (req, res) => {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { identifier, otp, newPassword } = req.body;

    WRITE.debug("POST /reset-password started", {
      requestId,
      identifier,
      timestamp: new Date().toISOString(),
    });

    await AuthService.resetPassword(identifier, otp, newPassword);

    WRITE.info("POST /reset-password completed successfully", {
      requestId,
      identifier,
      timestamp: new Date().toISOString(),
    });

    return UtilFunctions.outputSuccess(res, "Password reset successful");
  });

  static resendOtp = catchAsync(async (req, res) => {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { identifier } = req.body;

    WRITE.debug("POST /resend-otp started", {
      requestId,
      identifier,
      timestamp: new Date().toISOString(),
    });

    const result = await AuthService.resendOtp(identifier);

    WRITE.info("POST /resend-otp completed successfully", {
      requestId,
      identifier,
      timestamp: new Date().toISOString(),
    });

    return UtilFunctions.outputSuccess(res, result.message);
  });

  static refreshToken = catchAsync(async (req, res) => {
    const { refreshToken, userId } = req.body;

    const result = await AuthService.refreshToken(refreshToken, userId);

    return UtilFunctions.outputSuccess(res, {
      message: "Token refreshed successfully",
      ...result,
    });
  });
}

export default AuthController;
