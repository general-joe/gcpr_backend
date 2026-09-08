import catchAsync from "../../../middlewares/catchAsync.js";
import UtilFunctions from "../../../utils/UtilFunctions.js";
import ToolDefinitionService from "./toolDefinition.service.js";

export default class ToolDefinitionController {
  static list = catchAsync(async (req, res) => {
    const result = await ToolDefinitionService.listDefinitions();
    UtilFunctions.outputSuccess(res, result, "Tool definitions retrieved");
  });

  static get = catchAsync(async (req, res) => {
    const result = await ToolDefinitionService.getDefinition(req.params.id);
    UtilFunctions.outputSuccess(res, result, "Tool definition retrieved");
  });

  static create = catchAsync(async (req, res) => {
    const result = await ToolDefinitionService.createDraft(
      res.locals.user?.id,
      req.validatedData ?? req.body,
    );
    UtilFunctions.outputSuccess(res, result, "Tool draft created");
  });

  static update = catchAsync(async (req, res) => {
    const result = await ToolDefinitionService.updateDraft(req.params.id, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Tool draft updated");
  });

  static addSection = catchAsync(async (req, res) => {
    const result = await ToolDefinitionService.addSection(req.params.id, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Section added");
  });

  static updateSection = catchAsync(async (req, res) => {
    const result = await ToolDefinitionService.updateSection(req.params.sectionId, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Section updated");
  });

  static deleteSection = catchAsync(async (req, res) => {
    const result = await ToolDefinitionService.deleteSection(req.params.sectionId);
    UtilFunctions.outputSuccess(res, result, "Section deleted");
  });

  static addField = catchAsync(async (req, res) => {
    const result = await ToolDefinitionService.addField(
      req.params.id,
      req.params.sectionId,
      req.validatedData ?? req.body,
    );
    UtilFunctions.outputSuccess(res, result, "Field added");
  });

  static updateField = catchAsync(async (req, res) => {
    const result = await ToolDefinitionService.updateField(req.params.fieldId, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Field updated");
  });

  static deleteField = catchAsync(async (req, res) => {
    const result = await ToolDefinitionService.deleteField(req.params.fieldId);
    UtilFunctions.outputSuccess(res, result, "Field deleted");
  });

  static publish = catchAsync(async (req, res) => {
    const result = await ToolDefinitionService.publishTool(req.params.id, res.locals.user?.id);
    UtilFunctions.outputSuccess(res, result, "Tool version published");
  });

  static preview = catchAsync(async (req, res) => {
    const result = await ToolDefinitionService.previewTool(req.params.id);
    UtilFunctions.outputSuccess(res, result, "Tool preview rendered");
  });
}
