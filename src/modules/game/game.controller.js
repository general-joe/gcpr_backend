import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import GameService from "./game.service.js";

class GameController {
  static createGame = catchAsync(async (req, res) => {
    const result = await GameService.createGame(res.locals.user, req.body, req.file);
    UtilFunctions.outputSuccess(res, result, "Game resource created successfully");
  });

  static listGames = catchAsync(async (req, res) => {
    const result = await GameService.listGames(res.locals.user, req.query);
    UtilFunctions.outputSuccess(res, result, "Game resources retrieved successfully");
  });

  static listSelectableGames = catchAsync(async (req, res) => {
    const result = await GameService.listSelectableGames(res.locals.user, req.query);
    UtilFunctions.outputSuccess(res, result, "Selectable game resources retrieved successfully");
  });

  static getGameById = catchAsync(async (req, res) => {
    const result = await GameService.getGameById(res.locals.user, req.params.id);
    UtilFunctions.outputSuccess(res, result, "Game resource retrieved successfully");
  });

  static assignGame = catchAsync(async (req, res) => {
    const result = await GameService.assignGame(res.locals.user, req.params.id, req.body);
    UtilFunctions.outputSuccess(res, result, "Game assigned successfully", 201);
  });

  static listPatientAssignments = catchAsync(async (req, res) => {
    const result = await GameService.listPatientAssignments(res.locals.user, req.params.patientId);
    UtilFunctions.outputSuccess(res, result, "Patient game assignments retrieved successfully");
  });

  static logParticipation = catchAsync(async (req, res) => {
    const result = await GameService.logParticipation(res.locals.user, req.params.id, req.body);
    UtilFunctions.outputSuccess(res, result, "Game participation logged successfully", 201);
  });

  static getImprovementSummary = catchAsync(async (req, res) => {
    const result = await GameService.getImprovementSummary(res.locals.user, req.params.patientId, req.query);
    UtilFunctions.outputSuccess(res, result, "Game improvement summary retrieved successfully");
  });

  static updateGame = catchAsync(async (req, res) => {
    const result = await GameService.updateGame(res.locals.user, req.params.id, req.body);
    UtilFunctions.outputSuccess(res, result, "Game resource updated successfully");
  });

  static deleteGame = catchAsync(async (req, res) => {
    await GameService.deleteGame(res.locals.user, req.params.id);
    UtilFunctions.outputSuccess(res, {}, "Game resource deleted successfully");
  });

  static publishGame = catchAsync(async (req, res) => {
    const result = await GameService.publishGame(res.locals.user, req.params.id);
    UtilFunctions.outputSuccess(res, result, "Game resource published successfully");
  });

  static unpublishGame = catchAsync(async (req, res) => {
    const result = await GameService.unpublishGame(res.locals.user, req.params.id);
    UtilFunctions.outputSuccess(res, result, "Game resource unpublished successfully");
  });
}

export default GameController;
