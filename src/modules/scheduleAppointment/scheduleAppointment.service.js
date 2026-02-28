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

      const existingAppointment = await tx.appointment.findFirst({
        where: {
          providerId: payload.providerId,
          appointmentDate,
        },
        select: { id: true },
      });

      if (existingAppointment) {
        throw new gcprError(
          HttpStatus.CONFLICT,
          "Provider already has an appointment at this date and time",
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
}

export default ScheduleAppointmentService;
