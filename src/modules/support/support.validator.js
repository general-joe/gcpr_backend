import { z } from "zod";

export const createTicketSchema = z.object({
  category: z.enum(["ACCOUNT", "APPOINTMENT", "TECHNICAL", "BILLING", "CAREGIVER_SUPPORT", "PROVIDER_SUPPORT", "OTHER"]),
  subject: z.string().min(5).max(200),
  description: z.string().min(10),
  attachments: z.array(z.string()).optional().default([]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM")
});

export const addMessageSchema = z.object({
  content: z.string().min(1)
});

export const adminUpdateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_ON_USER", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedTo: z.string().uuid().optional().nullable()
});
