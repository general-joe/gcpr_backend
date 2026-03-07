import { z } from "zod";

export const availableProvidersQuerySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "time must be HH:mm"),
  })
  .strict();

export const scheduleAppointmentSchema = z
  .object({
    patientId: z.string().uuid("patientId must be a valid UUID"),
    providerId: z.string().uuid("providerId must be a valid UUID"),
    appointmentDate: z.coerce.date({
      invalid_type_error: "appointmentDate is required",
    }),
    reasonText: z.string().optional(),
    reasonAudio: z.string().optional(),

  })
  .strict();
