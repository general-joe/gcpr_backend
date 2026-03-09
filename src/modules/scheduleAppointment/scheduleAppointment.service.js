import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";

class ScheduleAppointmentService {
  static async requireCaregiver(userId) {
    if (!userId) {
      throw new gcprError(HttpStatus.UNAUTHORIZED, "Unauthorized request");
    }

    const caregiver = await prisma.careGiver.findUnique({
      where: { userId },
      select: { id: true, userId: true },
    });

    if (!caregiver) {
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        "Caregiver profile not found for this user",
      );
    }

    return caregiver;
  }

  static async ensurePatientBelongsToCaregiver(caregiverId, patientId) {
    const patient = await prisma.cpPatient.findUnique({
      where: { id: patientId },
      select: { id: true, caregiverId: true, fullName: true },
    });

    if (!patient) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Patient not found");
    }

    if (patient.caregiverId !== caregiverId) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "You do not have access to this patient",
      );
    }

    return patient;
  }

  static async ensureProviderExists(providerId) {
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        profession: true,
        facilityName: true,
        facilityAddress: true,
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });

    if (!provider) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Service provider not found");
    }

    return provider;
  }

  static getDateTimeParts(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return {
      dayOfWeek: date.getDay(),
      time: `${hours}:${minutes}`,
    };
  }

  static buildAppointmentDateTime(date, time) {
    const appointmentDateTime = new Date(`${date}T${time}:00`);

    if (isNaN(appointmentDateTime.getTime())) {
      throw new gcprError(HttpStatus.BAD_REQUEST, "Invalid date or time");
    }

    return appointmentDateTime;
  }

  static async getAvailableProviders(date, time) {
    const appointmentDate = ScheduleAppointmentService.buildAppointmentDateTime(
      date,
      time,
    );
    const { dayOfWeek } =
      ScheduleAppointmentService.getDateTimeParts(appointmentDate);

    const providers = await prisma.serviceProvider.findMany({
      where: {
        availabilities: {
          some: {
            dayOfWeek,
            startTime: { lte: time },
            endTime: { gte: time },
          },
        },
        appointments: {
          none: {
            appointmentDate,
          },
        },
      },
      select: {
        id: true,
        profession: true,
        facilityName: true,
        facilityAddress: true,
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      date,
      time,
      total: providers.length,
      providers,
    };
  }

  static async createAppointment(userId, payload) {
    const caregiver = await ScheduleAppointmentService.requireCaregiver(userId);
    await ScheduleAppointmentService.ensurePatientBelongsToCaregiver(
      caregiver.id,
      payload.patientId,
    );

    const appointmentDate = new Date(payload.appointmentDate);
    if (isNaN(appointmentDate.getTime())) {
      throw new gcprError(HttpStatus.BAD_REQUEST, "Invalid appointment date");
    }
    const now = new Date();

    if (appointmentDate < now) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "Cannot book appointment in the past",
      );
    }

    await ScheduleAppointmentService.ensureProviderExists(payload.providerId);

    const createdAppointment = await prisma.$transaction(async (tx) => {
      const { dayOfWeek, time } =
        ScheduleAppointmentService.getDateTimeParts(appointmentDate);

      const providerAvailability = await tx.providerAvailability.findFirst({
        where: {
          providerId: payload.providerId,
          dayOfWeek,
          startTime: { lte: time },
          endTime: { gte: time },
        },
        select: { id: true },
      });

      if (!providerAvailability) {
        throw new gcprError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "Provider is not available at the selected date and time",
        );
      }

      const startOfMinute = new Date(appointmentDate);
      const endOfMinute = new Date(appointmentDate);
      endOfMinute.setSeconds(59);
      endOfMinute.setMilliseconds(999);

      const existingAppointment = await tx.appointment.findFirst({
        where: {
          providerId: payload.providerId,
          appointmentDate: {
            gte: startOfMinute,
            lte: endOfMinute,
          },
        },
        select: { id: true },
      });

      if (existingAppointment) {
        throw new gcprError(
          HttpStatus.CONFLICT,
          "Provider already has an appointment at this time slot",
        );
      }

      const appointment = await tx.appointment.create({
        data: {
          patientId: payload.patientId,
          providerId: payload.providerId,
          appointmentDate,
          reason: payload.reason,
          status: "PENDING",
        },
        include: {
          patient: {
            select: { id: true, fullName: true },
          },
          provider: {
            select: {
              id: true,
              profession: true,
              facilityName: true,
              facilityAddress: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  phoneNumber: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return appointment;
    });

    return createdAppointment;
  }

  static async getProviderAvailability(providerId, date) {
    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      throw new gcprError(HttpStatus.BAD_REQUEST, "Invalid date");
    }

    const dayOfWeek = parsedDate.getDay();

    const availabilities = await prisma.providerAvailability.findMany({
      where: {
        providerId,
        dayOfWeek,
      },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    if (!availabilities.length) {
      return {
        providerId,
        date,
        message: "Provider has no availability for this date",
        slots: [],
      };
    }

    return {
      providerId,
      date,
      slots: availabilities,
    };
  }
  static async approveAppointment(userId, appointmentId) {
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      throw new gcprError(HttpStatus.FORBIDDEN, "Provider profile not found");
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || appointment.providerId !== provider.id) {
      throw new gcprError(HttpStatus.FORBIDDEN, "Unauthorized appointment");
    }

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "APPROVED",
      },
    });
  }
  static async rescheduleAppointment(userId, payload) {
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      throw new gcprError(HttpStatus.FORBIDDEN, "Provider profile not found");
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: payload.appointmentId },
    });

    if (!appointment || appointment.providerId !== provider.id) {
      throw new gcprError(HttpStatus.FORBIDDEN, "Unauthorized appointment");
    }

    const newDateTime = ScheduleAppointmentService.buildAppointmentDateTime(
      payload.newDate,
      payload.newTime,
    );

    const { dayOfWeek } =
      ScheduleAppointmentService.getDateTimeParts(newDateTime);

    const availability = await prisma.providerAvailability.findFirst({
      where: {
        providerId: provider.id,
        dayOfWeek,
        startTime: { lte: payload.newTime },
        endTime: { gte: payload.newTime },
      },
    });

    if (!availability) {
      throw new gcprError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Provider not available at new time",
      );
    }

    return prisma.appointment.update({
      where: { id: payload.appointmentId },
      data: {
        appointmentDate: newDateTime,
        status: "RESCHEDULED",
      },
    });
  }
  static async providerAppointments(userId, query) {
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId },
      select: { id: true },
    });

    const where = { providerId: provider.id };

    if (query.date) {
      const start = new Date(query.date);
      const end = new Date(query.date);
      end.setHours(23, 59, 59);

      where.appointmentDate = { gte: start, lte: end };
    }

    if (query.month) {
      const start = new Date(`${query.month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      where.appointmentDate = { gte: start, lt: end };
    }

    return prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        provider: true,
      },
      orderBy: {
        appointmentDate: "asc",
      },
    });
  }
  static async caregiverAppointments(userId, query) {
    const caregiver = await this.requireCaregiver(userId);

    const where = {
      patient: {
        caregiverId: caregiver.id,
      },
    };

    if (query.date) {
      const start = new Date(query.date);
      const end = new Date(query.date);
      end.setHours(23, 59, 59);

      where.appointmentDate = { gte: start, lte: end };
    }

    if (query.month) {
      const start = new Date(`${query.month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      where.appointmentDate = { gte: start, lt: end };
    }

    return prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        provider: true,
      },
      orderBy: {
        appointmentDate: "asc",
      },
    });
  }
}

export default ScheduleAppointmentService;
