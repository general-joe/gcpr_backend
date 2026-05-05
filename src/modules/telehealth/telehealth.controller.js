import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import TelehealthService from "./telehealth.service.js";

class TelehealthController {
  static createRoom = catchAsync(async (req, res) => {
    const result = await TelehealthService.createRoom(res.locals.user, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Telehealth room created successfully");
  });

  static listRooms = catchAsync(async (req, res) => {
    const result = await TelehealthService.listRooms(res.locals.user, req.query);
    UtilFunctions.outputSuccess(res, result, "Telehealth rooms retrieved successfully");
  });

  static getRoomById = catchAsync(async (req, res) => {
    const result = await TelehealthService.getRoomById(res.locals.user, req.params.id);
    UtilFunctions.outputSuccess(res, result, "Telehealth room retrieved successfully");
  });

  static updateRoom = catchAsync(async (req, res) => {
    const result = await TelehealthService.updateRoom(res.locals.user, req.params.id, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Telehealth room updated successfully");
  });

  static cancelRoom = catchAsync(async (req, res) => {
    const result = await TelehealthService.cancelRoom(res.locals.user, req.params.id);
    UtilFunctions.outputSuccess(res, result, "Telehealth room canceled successfully");
  });

  static inviteToRoom = catchAsync(async (req, res) => {
    const { userIds } = req.validatedData ?? req.body;
    const result = await TelehealthService.inviteToRoom(res.locals.user, req.params.id, userIds);
    UtilFunctions.outputSuccess(res, result, "Users invited successfully");
  });

  static getParticipants = catchAsync(async (req, res) => {
    const result = await TelehealthService.getParticipants(res.locals.user, req.params.id);
    UtilFunctions.outputSuccess(res, result, "Participants retrieved successfully");
  });

  static joinRoom = catchAsync(async (req, res) => {
    const result = await TelehealthService.joinRoom(res.locals.user, req.params.id);
    UtilFunctions.outputSuccess(res, result, "Joined room successfully");
  });

  static getCountdown = catchAsync(async (req, res) => {
    const result = await TelehealthService.getCountdown(res.locals.user, req.params.id);
    UtilFunctions.outputSuccess(res, result, "Countdown retrieved successfully");
  });

  static updateRoomStatus = catchAsync(async (req, res) => {
    const { status } = req.validatedData ?? req.body;
    const result = await TelehealthService.updateRoomStatus(res.locals.user, req.params.id, status);
    UtilFunctions.outputSuccess(res, result, "Room status updated successfully");
  });
}

export default TelehealthController;
