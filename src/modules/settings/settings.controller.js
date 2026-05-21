import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";

const DEFAULT_SETTINGS = {
  allowPatientBooking: true,
  minAppointmentNotice: 24,
  defaultDuration: 30,
  bufferTime: 15,
  maxDailyAppointments: 20,
  enableReminders: true,
  reminderLeadTime: 2,
  requireConfirmation: false,
  enableWaitlist: true,
  slotInterval: 30,
  workingHours: [
    { day: "Monday", enabled: true, start: "09:00", end: "17:00" },
    { day: "Tuesday", enabled: true, start: "09:00", end: "17:00" },
    { day: "Wednesday", enabled: true, start: "09:00", end: "17:00" },
    { day: "Thursday", enabled: true, start: "09:00", end: "17:00" },
    { day: "Friday", enabled: true, start: "09:00", end: "17:00" },
    { day: "Saturday", enabled: false, start: "10:00", end: "14:00" },
    { day: "Sunday", enabled: false, start: "10:00", end: "14:00" },
  ],
};

class SettingsController {
  static async getAppointmentSettings(req, res) {
    try {
      let settings = await prisma.appointmentSettings.findFirst();

      if (!settings) {
        settings = await prisma.appointmentSettings.create({
          data: DEFAULT_SETTINGS,
        });
      }

      return res.status(HttpStatus.OK).json({
        status: true,
        data: settings,
      });
    } catch (error) {
      console.error("Error fetching appointment settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch appointment settings",
      });
    }
  }

  static async updateAppointmentSettings(req, res) {
    try {
      const { id, ...settingsData } = req.body;

      let settings = await prisma.appointmentSettings.findFirst();

      if (!settings) {
        settings = await prisma.appointmentSettings.create({
          data: settingsData,
        });
      } else {
        settings = await prisma.appointmentSettings.update({
          where: { id: settings.id },
          data: settingsData,
        });
      }

      return res.status(HttpStatus.OK).json({
        status: true,
        message: "Settings updated successfully",
        data: settings,
      });
    } catch (error) {
      console.error("Error updating appointment settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to update appointment settings",
      });
    }
  }
}

export default SettingsController;