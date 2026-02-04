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
    const { email, otp } = req.body;

    const result = await AuthService.verifyOtp(email, otp);

    return UtilFunctions.outputSuccess(res, {
      message: 'Account verified successfully',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  });

  static login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await AuthService.loginUser(email, password);
    UtilFunctions.outputSuccess(res, {
      message: 'Login successful',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  });

  static forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  await AuthService.forgotPassword(email);

  return UtilFunctions.outputSuccess(res, 'OTP sent to email');
});


static resetPassword = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  await AuthService.resetPassword(email, otp, newPassword);

  return UtilFunctions.outputSuccess(res, 'Password reset successful');
});

}
export default AuthController;
