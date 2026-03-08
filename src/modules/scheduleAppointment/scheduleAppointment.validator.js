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

export const approveAppointmentSchema = z
  .object({
    appointmentId: z.string().uuid(),
  })
  .strict();

export const rescheduleAppointmentSchema = z
  .object({
    appointmentId: z.string().uuid(),
    newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    newTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  })
  .strict();

export const appointmentsQuerySchema = z
  .object({
    date: z.string().optional(),
    month: z.string().optional(), // format YYYY-MM
  })
  .strict();
