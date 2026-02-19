import UtilFunctions from "../../utils/UtilFunctions.js";
import AuthService from "./auth.service.js";
import catchAsync from "../../middlewares/catchAsync.js";
import constants from "../../utils/constants.js";

class AuthController {
  static registerUser = catchAsync(async (req, res) => {
    const userData = {
      ...req.body,
      id: UtilFunctions.genId(),
    };

    const result = await AuthService.registerUser(req, userData);

    const message =
      result.otpChannel === constants.OTP_MODES.SMS
        ? "Registration successful. An OTP has been sent to your phone number."
        : "Registration successful. An OTP has been sent to your email address.";

    return UtilFunctions.outputSuccess(res, {
      message,
      otpChannel: result.otpChannel,
    });
  });

  static verifyOtp = catchAsync(async (req, res) => {
    const { identifier, otp } = req.body;

    const result = await AuthService.verifyOtp(identifier, otp);

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
    const { identifier } = req.body;

    await AuthService.forgotPassword(identifier);

    return UtilFunctions.outputSuccess(res, "OTP sent");
  });

  static resetPassword = catchAsync(async (req, res) => {
    const { identifier, otp, newPassword } = req.body;

    await AuthService.resetPassword(identifier, otp, newPassword);

    return UtilFunctions.outputSuccess(res, "Password reset successful");
  });

  static resendOtp = catchAsync(async (req, res) => {
    const { identifier } = req.body;

    const result = await AuthService.resendOtp(identifier);

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
