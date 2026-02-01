import UtilFunctions from "../../utils/UtilFunctions.js";
import AuthService from "./auth.service.js";
import catchAsync from "../../middlewares/catchAsync.js";

class AuthController {
    static registerUser = catchAsync(async (req, res) => {
        const userData = req.body;
        console.log(req.body, userData)
        const newUser = await AuthService.registerUser(userData);
        UtilFunctions.outputSuccess(res, 'Check email for otp');
    });

    static verifyOtp = catchAsync(async (req, res) => {
        const { email, otp } = req.body;
        const result = await AuthService.verifyOtp(email, otp);
        UtilFunctions.outputSuccess(res, result.message);
    });

    static login = catchAsync(async (req, res) => {
        const { email, password } = req.body;
        const user = await AuthService.loginUser(email, password);
        UtilFunctions.outputSuccess(res, user);
    });

}
export default AuthController;