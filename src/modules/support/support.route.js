import express from "express";
import rateLimit from "express-rate-limit";
import { authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.js";
import SupportController from "./support.controller.js";
import {
  createTicketSchema,
  addMessageSchema,
  adminUpdateTicketSchema
} from "./support.validator.js";

const supportRouter = express.Router();
const adminSupportRouter = express.Router();

const ticketCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many requests. Please try again later."
});

const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many messages. Please try again later."
});

// ─── User Support Routes ───────────────────────────────────────────────────────
supportRouter.post(
  "/tickets",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  ticketCreateLimiter,
  validate(createTicketSchema),
  SupportController.createTicket
);

supportRouter.get(
  "/tickets",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  SupportController.listTickets
);

supportRouter.get(
  "/tickets/:ticketId",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  SupportController.getTicket
);

supportRouter.post(
  "/tickets/:ticketId/messages",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  messageLimiter,
  validate(addMessageSchema),
  SupportController.addMessage
);

supportRouter.patch(
  "/tickets/:ticketId/close",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  SupportController.closeTicket
);

// ─── Admin Support Routes ──────────────────────────────────────────────────────
adminSupportRouter.get(
  "/tickets",
  authorize(["ADMIN"]),
  SupportController.adminListTickets
);

adminSupportRouter.get(
  "/tickets/:ticketId",
  authorize(["ADMIN"]),
  SupportController.adminGetTicket
);

adminSupportRouter.patch(
  "/tickets/:ticketId",
  authorize(["ADMIN"]),
  validate(adminUpdateTicketSchema),
  SupportController.adminUpdateTicket
);

adminSupportRouter.post(
  "/tickets/:ticketId/messages",
  authorize(["ADMIN"]),
  messageLimiter,
  validate(addMessageSchema),
  SupportController.adminAddMessage
);

export default supportRouter;
export { adminSupportRouter };
