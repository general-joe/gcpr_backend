import UtilFunctions from "../../utils/UtilFunctions.js";
import UserService from "./user.service.js";
import catchAsync from "../../middlewares/catchAsync.js";

class UserController {
  static getProfile = catchAsync(async (req, res) => {
    const userId = res.locals.user?.id;

    if (!userId) {
      return UtilFunctions.outputError(res, "Unauthorized", {}, undefined, 401);
    }

    const user = await UserService.getProfile(userId);

    return UtilFunctions.outputSuccess(res, { user }, "Profile fetched");
  });
}

export default UserController;
