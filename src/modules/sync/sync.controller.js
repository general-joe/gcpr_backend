import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import SyncService from "./sync.service.js";

export default class SyncController {
  // POST /sync/push — called by the app as soon as connectivity returns.
  static push = catchAsync(async (req, res) => {
    const { operations } = req.validatedData ?? req.body;
    const result = await SyncService.push(res.locals.user, operations);
    UtilFunctions.outputSuccess(res, result, "Sync completed");
  });
}
