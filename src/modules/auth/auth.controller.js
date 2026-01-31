import UtilFunctions from "../../utils/UtilFunctions.js";
import AuthService from "./auth.service.js";
import catchAsync from "../../middlewares/catchAsync.js";

class AuthController {
    static registerUser = catchAsync(async (req, res) => {
        const userData = req.body;
        console.log(req.body, userData)
        const newUser = await AuthService.registerUser(userData);
        UtilFunctions.outputSuccess(res, { user: newUser }, 'User registered successfully');
    });

}
export default AuthController;