import { z } from "zod";

const ticketCategory = z.enum([
  "ACCOUNT",
  "APPOINTMENT",
  "TECHNICAL",
  "BILLING",
  "CAREGIVER_SUPPORT",
  "PROVIDER_SUPPORT",
  "OTHER",
]);

const ticketPriority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

const supportTicketOp = z.object({
  category: ticketCategory,
  subject: z.string().min(5).max(200),
  description: z.string().min(10),
  attachments: z.array(z.string()).optional().default([]),
  priority: ticketPriority.optional().default("MEDIUM"),
});

const ticketMessageOp = z.object({
  // Either a server ticket id, or the clientId of a support_ticket
  // operation in the same/earlier batch (offline-created ticket).
  ticketId: z.string().min(1).optional(),
  clientTicketId: z.string().min(1).optional(),
  content: z.string().min(1),
});

const adherenceLogOp = z.object({
  taskId: z.string().min(1),
  logDate: z.string().min(1),
  status: z.enum(["PENDING", "COMPLETED", "MISSED"]).optional().default("COMPLETED"),
  notes: z.string().optional().nullable(),
});

const directMessageOp = z.object({
  receiverId: z.string().min(1),
  content: z.string().optional().nullable(),
  mediaUrl: z.string().optional().nullable(),
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "AUDIO", "FILE"]).optional().default("TEXT"),
  caption: z.string().optional().nullable(),
});

const communityMessageOp = z.object({
  groupId: z.string().min(1),
  content: z.string().max(5000).optional().default(""),
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "LOCATION"]).optional().default("TEXT"),
  mediaUrl: z.string().url("Invalid media URL").optional().nullable(),
  replyToId: z.string().uuid("Invalid reply message ID").optional(),
  caption: z.string().max(5000).optional().nullable(),
});

const taskDayDoneOp = z.object({
  patientId: z.string().min(1),
  taskId: z.string().min(1),
  date: z.string().min(1).optional(),
});

const appointmentRequestOp = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  appointmentDate: z.string().min(1),
  reasonText: z.string().optional().nullable(),
  reasonAudio: z.string().optional().nullable(),
});

const operationSchema = z.object({
  // Client-generated stable id (uuid). Retries with the same clientId
  // return the original result instead of creating duplicates.
  clientId: z.string().min(1).max(128),
  type: z.enum([
    "support_ticket",
    "ticket_message",
    "adherence_log",
    "direct_message",
    "community_message",
    "task_day_done",
    "appointment_request",
  ]),
  createdAt: z.string().optional(),
  data: z.unknown(),
});

export const syncPushSchema = z.object({
  deviceId: z.string().max(128).optional(),
  operations: z.array(operationSchema).min(1).max(50),
});

export const typedDataSchemas = {
  support_ticket: supportTicketOp,
  ticket_message: ticketMessageOp,
  adherence_log: adherenceLogOp,
  direct_message: directMessageOp,
  community_message: communityMessageOp,
  task_day_done: taskDayDoneOp,
  appointment_request: appointmentRequestOp,
};
