import UtilFunctions from "../../utils/UtilFunctions.js";
import AuthService from "./auth.service.js";
import catchAsync from "../../middlewares/catchAsync.js";

class AuthController {
  static registerUser = catchAsync(async (req, res) => {
    console.log(req.body, req.files);
    if (!_.has(req.files, "profileImage")) {
      return UtilFunctions.outputError(res, "No selfie image specified");
    }

    const userData = { ...req.body, ...{ id: UtilFunctions.genId() } };
    console.log(req.body, userData);
    const newUser = await AuthService.registerUser(req, userData);
    UtilFunctions.outputSuccess(res, "Check email for otp");
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



}
export default AuthController;
