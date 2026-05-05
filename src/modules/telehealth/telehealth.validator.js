import { z } from "zod";

export const createRoomSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  scheduledStart: z.coerce.date(),
  scheduledEnd: z.coerce.date(),
  visibility: z.enum(["private", "organization", "public"]).optional().default("private"),
  maxParticipants: z.number().int().min(2).max(500).optional().default(50),
  patientIds: z.array(z.string().uuid()).optional().default([])
}).refine(d => new Date(d.scheduledEnd) > new Date(d.scheduledStart), "scheduledEnd must be after scheduledStart");

export const updateRoomSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(1000).optional(),
  scheduledStart: z.coerce.date().optional(),
  scheduledEnd: z.coerce.date().optional()
});

export const inviteUsersSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1)
});

export const updateRoomStatusSchema = z.object({
  status: z.enum(["scheduled", "live", "completed", "canceled"])
});
