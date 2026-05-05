import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import SupportService from "./support.service.js";

export default class SupportController {
  static createTicket = catchAsync(async (req, res) => {
    const result = await SupportService.createTicket(res.locals.user.id, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Support ticket created successfully");
  });

  static listTickets = catchAsync(async (req, res) => {
    const result = await SupportService.listTickets(res.locals.user.id, req.query);
    UtilFunctions.outputSuccess(res, result, "Tickets retrieved successfully");
  });

  static getTicket = catchAsync(async (req, res) => {
    const result = await SupportService.getTicket(res.locals.user.id, req.params.ticketId);
    UtilFunctions.outputSuccess(res, result, "Ticket retrieved successfully");
  });

  static addMessage = catchAsync(async (req, res) => {
    const { content } = req.validatedData ?? req.body;
    const result = await SupportService.addMessage(res.locals.user.id, req.params.ticketId, content);
    UtilFunctions.outputSuccess(res, result, "Message sent successfully");
  });

  static closeTicket = catchAsync(async (req, res) => {
    const result = await SupportService.closeTicket(res.locals.user.id, req.params.ticketId);
    UtilFunctions.outputSuccess(res, result, "Ticket closed successfully");
  });

  // Admin
  static adminListTickets = catchAsync(async (req, res) => {
    const result = await SupportService.adminListTickets(req.query);
    UtilFunctions.outputSuccess(res, result, "Tickets retrieved successfully");
  });

  static adminGetTicket = catchAsync(async (req, res) => {
    const result = await SupportService.adminGetTicket(req.params.ticketId);
    UtilFunctions.outputSuccess(res, result, "Ticket retrieved successfully");
  });

  static adminUpdateTicket = catchAsync(async (req, res) => {
    const result = await SupportService.adminUpdateTicket(req.params.ticketId, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "Ticket updated successfully");
  });

  static adminAddMessage = catchAsync(async (req, res) => {
    const { content } = req.validatedData ?? req.body;
    const result = await SupportService.adminAddMessage(res.locals.user.id, req.params.ticketId, content);
    UtilFunctions.outputSuccess(res, result, "Message sent successfully");
  });
}
