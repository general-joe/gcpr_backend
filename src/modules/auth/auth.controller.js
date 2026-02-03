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
     
    UtilFunctions.outputSuccess(res, {message:"Check email for otp",otp:newUser});
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
}
export default AuthController;
