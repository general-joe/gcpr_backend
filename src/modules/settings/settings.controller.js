import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";

// ── Default values for well-known settings ──────────────────────────────

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

const DEFAULT_TELEHEALTH_SETTINGS = {
  enableTelehealth: true,
  defaultProviderMinutes: 30,
  maxConcurrentSessions: 5,
  recordingEnabled: false,
  waitingRoomEnabled: true,
  requireApproval: false,
  sessionTimeout: 30,
  connectTimeout: 10,
};

// ── PlatformSetting defaults (key → defaultValue) ──────────────────────

const PLATFORM_SETTING_DEFAULTS = {
  "platform:general": {
    appName: "GMNC",
    appTagline: "Get My Neuro Care",
    supportEmail: "support@gmnc.com",
    supportPhone: "",
    timezone: "Africa/Accra",
    dateFormat: "DD/MM/YYYY",
    language: "en",
    logoUrl: "",
    maintenanceMode: false,
    maintenanceMessage: "System is under maintenance. Please check back later.",
  },
  "platform:workspace": {
    defaultDashboardView: "overview",
    enableDarkMode: false,
    sidebarCollapsed: false,
    itemsPerPage: 20,
    defaultSortOrder: "desc",
    showPatientIds: true,
    enableQuickActions: true,
  },
  "platform:security": {
    enforceStrongPasswords: true,
    minPasswordLength: 8,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    sessionTimeoutMinutes: 60,
    requireEmailVerification: true,
    enableTwoFactorAuth: false,
    allowPasswordReset: true,
    passwordExpiryDays: 90,
    allowedIpRanges: [],
  },
  "platform:referrals": {
    enableAutoAssignment: false,
    defaultReferralExpiryDays: 30,
    enableSLATracking: true,
    slaWarningHours: 48,
    slaEscalationHours: 72,
    requireClinicalNotes: true,
    enableReferralNotifications: true,
    allowedTargetProfessions: [
      "PHYSIOTHERAPIST",
      "OCCUPATIONAL_THERAPIST",
      "SPEECH_THERAPIST",
      "CLINICAL_PSYCHOLOGIST",
      "DIETITIAN",
      "PHARMACIST",
    ],
  },
  "platform:clinical-notes": {
    requireAssessmentNotes: true,
    requireSessionDocumentation: true,
    enableNoteTemplates: true,
    defaultNoteTemplates: [
      "Initial Assessment",
      "Progress Note",
      "Discharge Summary",
      "Referral Note",
    ],
    enableAutoSave: true,
    autoSaveIntervalSeconds: 30,
    requireSignatureForNotes: false,
    noteRetentionDays: 365,
    enableClinicalTags: true,
  },
  "platform:support": {
    enableAutoResponse: true,
    defaultTicketPriority: "MEDIUM",
    autoAssignTickets: false,
    enableCannedResponses: true,
    slaResponseHours: 24,
    slaResolutionHours: 72,
    enableSatisfactionSurvey: true,
    allowAnonymousTickets: false,
    enableEscalation: true,
  },
  "platform:escalations": {
    enableAutoEscalation: true,
    escalationThresholdHours: 48,
    maxEscalationLevel: 3,
    notifyOnEscalation: true,
    escalationRecipients: [],
    categories: [
      { id: "cat-1", name: "Technical Issue", severity: "medium", autoEscalate: true },
      { id: "cat-2", name: "Billing Dispute", severity: "high", autoEscalate: true },
      { id: "cat-3", name: "Patient Safety", severity: "urgent", autoEscalate: true },
      { id: "cat-4", name: "Account Access", severity: "medium", autoEscalate: false },
      { id: "cat-5", name: "Feature Request", severity: "low", autoEscalate: false },
    ],
  },
  "platform:compliance": {
    requireConsentForDataSharing: true,
    requireConsentForRecording: true,
    requireConsentForPhoto: true,
    enableHipaaCompliance: true,
    dataEncryptionAtRest: true,
    dataEncryptionInTransit: true,
    auditTrailEnabled: true,
    auditLogRetentionDays: 365,
    enablePatientDataExport: true,
    enableRightToErasure: true,
    dpoEmail: "",
  },
  "platform:data-retention": {
    enableAutoCleanup: false,
    patientDataRetentionDays: 2555,
    assessmentRetentionDays: 2555,
    messageRetentionDays: 1825,
    appointmentRetentionDays: 1095,
    auditLogRetentionDays: 365,
    telehealthRecordingRetentionDays: 365,
    inactiveAccountRetentionDays: 730,
    enableRetentionNotifications: true,
    notificationBeforeDays: 30,
  },
  "platform:games": {
    enableGamesModule: true,
    allowYouTubeGames: true,
    allowExternalGames: true,
    requireApprovalForUpload: true,
    maxFileSizeMB: 100,
    allowedFileTypes: ["mp4", "webm", "html5"],
    enableGameAnalytics: true,
    enableGameRecommendations: true,
    defaultAgeRange: { min: 3, max: 12 },
    enableCaregiverAccess: true,
  },
  "platform:faqs": {
    enableFaqModule: true,
    showHelpWidget: true,
    helpWidgetPosition: "bottom-right",
    enableSearchSuggestions: true,
    showPopularFaqs: true,
    faqsPerPage: 10,
    enableFeedbackOnFaqs: true,
    requireApprovalForPublicFaq: true,
  },
};

// ── Helper: Generic PlatformSetting CRUD ────────────────────────────────

async function getSettingByKey(key) {
  const setting = await prisma.platformSetting.findUnique({ where: { key } });
  return setting;
}

async function getSettingWithDefaults(key) {
  const setting = await prisma.platformSetting.findUnique({ where: { key } });
  const defaults = PLATFORM_SETTING_DEFAULTS[key] || {};
  if (setting) {
    return { ...defaults, ...setting.value, id: setting.id, key: setting.key, category: setting.category };
  }
  return { ...defaults };
}

async function upsertSetting(key, value, category = "general") {
  const existing = await prisma.platformSetting.findUnique({ where: { key } });
  if (existing) {
    return prisma.platformSetting.update({
      where: { key },
      data: { value, category },
    });
  }
  return prisma.platformSetting.create({
    data: { key, value, category },
  });
}

// ── Controller ─────────────────────────────────────────────────────────

class SettingsController {
  // ── Appointment Settings ────────────────────────────────────────────

  static async getAppointmentSettings(req, res) {
    try {
      let settings = await prisma.appointmentSettings.findFirst();
      if (!settings) {
        settings = await prisma.appointmentSettings.create({
          data: DEFAULT_SETTINGS,
        });
      }
      return res.status(HttpStatus.OK).json({ status: true, data: settings });
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
        settings = await prisma.appointmentSettings.create({ data: settingsData });
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

  // ── Telehealth Settings ─────────────────────────────────────────────

  static async getTelehealthSettings(req, res) {
    try {
      let settings = await prisma.telehealthSettings.findFirst();
      if (!settings) {
        settings = await prisma.telehealthSettings.create({
          data: DEFAULT_TELEHEALTH_SETTINGS,
        });
      }
      return res.status(HttpStatus.OK).json({ status: true, data: settings });
    } catch (error) {
      console.error("Error fetching telehealth settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch telehealth settings",
      });
    }
  }

  static async updateTelehealthSettings(req, res) {
    try {
      const { id, ...settingsData } = req.body;
      let settings = await prisma.telehealthSettings.findFirst();
      if (!settings) {
        settings = await prisma.telehealthSettings.create({ data: settingsData });
      } else {
        settings = await prisma.telehealthSettings.update({
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
      console.error("Error updating telehealth settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to update telehealth settings",
      });
    }
  }

  // ── Generic Platform Settings (key-value) ───────────────────────────

  static async getPlatformGeneralSettings(req, res) {
    try {
      const data = await getSettingWithDefaults("platform:general");
      return res.status(HttpStatus.OK).json({ status: true, data });
    } catch (error) {
      console.error("Error fetching platform general settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch platform settings",
      });
    }
  }

  static async updatePlatformGeneralSettings(req, res) {
    try {
      const { id, createdAt, updatedAt, ...settingsData } = req.body;
      const saved = await upsertSetting("platform:general", settingsData, "general");
      return res.status(HttpStatus.OK).json({
        status: true,
        message: "Platform settings updated successfully",
        data: { id: saved.id, key: saved.key, ...settingsData },
      });
    } catch (error) {
      console.error("Error updating platform general settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to update platform settings",
      });
    }
  }

  static async getWorkspaceSettings(req, res) {
    try {
      const data = await getSettingWithDefaults("platform:workspace");
      return res.status(HttpStatus.OK).json({ status: true, data });
    } catch (error) {
      console.error("Error fetching workspace settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch workspace settings",
      });
    }
  }

  static async updateWorkspaceSettings(req, res) {
    try {
      const { id, createdAt, updatedAt, ...settingsData } = req.body;
      const saved = await upsertSetting("platform:workspace", settingsData, "workspace");
      return res.status(HttpStatus.OK).json({
        status: true,
        message: "Workspace settings updated successfully",
        data: { id: saved.id, key: saved.key, ...settingsData },
      });
    } catch (error) {
      console.error("Error updating workspace settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to update workspace settings",
      });
    }
  }

  static async getSecuritySettings(req, res) {
    try {
      const data = await getSettingWithDefaults("platform:security");
      return res.status(HttpStatus.OK).json({ status: true, data });
    } catch (error) {
      console.error("Error fetching security settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch security settings",
      });
    }
  }

  static async updateSecuritySettings(req, res) {
    try {
      const { id, createdAt, updatedAt, ...settingsData } = req.body;
      const saved = await upsertSetting("platform:security", settingsData, "security");
      return res.status(HttpStatus.OK).json({
        status: true,
        message: "Security settings updated successfully",
        data: { id: saved.id, key: saved.key, ...settingsData },
      });
    } catch (error) {
      console.error("Error updating security settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to update security settings",
      });
    }
  }

  static async getReferralSettings(req, res) {
    try {
      const data = await getSettingWithDefaults("platform:referrals");
      return res.status(HttpStatus.OK).json({ status: true, data });
    } catch (error) {
      console.error("Error fetching referral settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch referral settings",
      });
    }
  }

  static async updateReferralSettings(req, res) {
    try {
      const { id, createdAt, updatedAt, ...settingsData } = req.body;
      const saved = await upsertSetting("platform:referrals", settingsData, "referrals");
      return res.status(HttpStatus.OK).json({
        status: true,
        message: "Referral settings updated successfully",
        data: { id: saved.id, key: saved.key, ...settingsData },
      });
    } catch (error) {
      console.error("Error updating referral settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to update referral settings",
      });
    }
  }

  static async getClinicalNotesSettings(req, res) {
    try {
      const data = await getSettingWithDefaults("platform:clinical-notes");
      return res.status(HttpStatus.OK).json({ status: true, data });
    } catch (error) {
      console.error("Error fetching clinical notes settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch clinical notes settings",
      });
    }
  }

  static async updateClinicalNotesSettings(req, res) {
    try {
      const { id, createdAt, updatedAt, ...settingsData } = req.body;
      const saved = await upsertSetting("platform:clinical-notes", settingsData, "clinical-notes");
      return res.status(HttpStatus.OK).json({
        status: true,
        message: "Clinical notes settings updated successfully",
        data: { id: saved.id, key: saved.key, ...settingsData },
      });
    } catch (error) {
      console.error("Error updating clinical notes settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to update clinical notes settings",
      });
    }
  }

  static async getSupportSettings(req, res) {
    try {
      const data = await getSettingWithDefaults("platform:support");
      return res.status(HttpStatus.OK).json({ status: true, data });
    } catch (error) {
      console.error("Error fetching support settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch support settings",
      });
    }
  }

  static async updateSupportSettings(req, res) {
    try {
      const { id, createdAt, updatedAt, ...settingsData } = req.body;
      const saved = await upsertSetting("platform:support", settingsData, "support");
      return res.status(HttpStatus.OK).json({
        status: true,
        message: "Support settings updated successfully",
        data: { id: saved.id, key: saved.key, ...settingsData },
      });
    } catch (error) {
      console.error("Error updating support settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to update support settings",
      });
    }
  }

  static async getEscalationSettings(req, res) {
    try {
      const data = await getSettingWithDefaults("platform:escalations");
      return res.status(HttpStatus.OK).json({ status: true, data });
    } catch (error) {
      console.error("Error fetching escalation settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch escalation settings",
      });
    }
  }

  static async updateEscalationSettings(req, res) {
    try {
      const { id, createdAt, updatedAt, ...settingsData } = req.body;
      const saved = await upsertSetting("platform:escalations", settingsData, "escalations");
      return res.status(HttpStatus.OK).json({
        status: true,
        message: "Escalation settings updated successfully",
        data: { id: saved.id, key: saved.key, ...settingsData },
      });
    } catch (error) {
      console.error("Error updating escalation settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to update escalation settings",
      });
    }
  }

  static async getComplianceSettings(req, res) {
    try {
      const data = await getSettingWithDefaults("platform:compliance");
      return res.status(HttpStatus.OK).json({ status: true, data });
    } catch (error) {
      console.error("Error fetching compliance settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch compliance settings",
      });
    }
  }

  static async updateComplianceSettings(req, res) {
    try {
      const { id, createdAt, updatedAt, ...settingsData } = req.body;
      const saved = await upsertSetting("platform:compliance", settingsData, "compliance");
      return res.status(HttpStatus.OK).json({
        status: true,
        message: "Compliance settings updated successfully",
        data: { id: saved.id, key: saved.key, ...settingsData },
      });
    } catch (error) {
      console.error("Error updating compliance settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to update compliance settings",
      });
    }
  }

  static async getDataRetentionSettings(req, res) {
    try {
      const data = await getSettingWithDefaults("platform:data-retention");
      return res.status(HttpStatus.OK).json({ status: true, data });
    } catch (error) {
      console.error("Error fetching data retention settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch data retention settings",
      });
    }
  }

  static async updateDataRetentionSettings(req, res) {
    try {
      const { id, createdAt, updatedAt, ...settingsData } = req.body;
      const saved = await upsertSetting("platform:data-retention", settingsData, "data-retention");
      return res.status(HttpStatus.OK).json({
        status: true,
        message: "Data retention settings updated successfully",
        data: { id: saved.id, key: saved.key, ...settingsData },
      });
    } catch (error) {
      console.error("Error updating data retention settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to update data retention settings",
      });
    }
  }

  static async getGamesSettings(req, res) {
    try {
      const data = await getSettingWithDefaults("platform:games");
      return res.status(HttpStatus.OK).json({ status: true, data });
    } catch (error) {
      console.error("Error fetching games settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch games settings",
      });
    }
  }

  static async updateGamesSettings(req, res) {
    try {
      const { id, createdAt, updatedAt, ...settingsData } = req.body;
      const saved = await upsertSetting("platform:games", settingsData, "games");
      return res.status(HttpStatus.OK).json({
        status: true,
        message: "Games settings updated successfully",
        data: { id: saved.id, key: saved.key, ...settingsData },
      });
    } catch (error) {
      console.error("Error updating games settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to update games settings",
      });
    }
  }

  static async getFaqSettings(req, res) {
    try {
      const data = await getSettingWithDefaults("platform:faqs");
      return res.status(HttpStatus.OK).json({ status: true, data });
    } catch (error) {
      console.error("Error fetching FAQ settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch FAQ settings",
      });
    }
  }

  static async updateFaqSettings(req, res) {
    try {
      const { id, createdAt, updatedAt, ...settingsData } = req.body;
      const saved = await upsertSetting("platform:faqs", settingsData, "faqs");
      return res.status(HttpStatus.OK).json({
        status: true,
        message: "FAQ settings updated successfully",
        data: { id: saved.id, key: saved.key, ...settingsData },
      });
    } catch (error) {
      console.error("Error updating FAQ settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to update FAQ settings",
      });
    }
  }

  // ── User Appearance Settings ───────────────────────────────────────

  static async getUserAppearance(req, res) {
    try {
      const { userId } = req.params;
      const key = `user:appearance:${userId}`;
      const setting = await prisma.platformSetting.findUnique({ where: { key } });
      const defaultAppearance = {
        themeMode: "light",
        colorPreset: "emerald",
        fontFamily: "geist",
        fontSize: "medium",
      };
      const data = setting ? { ...defaultAppearance, ...setting.value } : defaultAppearance;
      return res.status(HttpStatus.OK).json({ status: true, data });
    } catch (error) {
      console.error("Error fetching user appearance:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch appearance settings",
      });
    }
  }

  static async updateUserAppearance(req, res) {
    try {
      const { userId } = req.params;
      const { themeMode, colorPreset, fontFamily, fontSize } = req.body;
      const key = `user:appearance:${userId}`;
      const value = { themeMode, colorPreset, fontFamily, fontSize };
      const saved = await upsertSetting(key, value, "appearance");
      return res.status(HttpStatus.OK).json({
        status: true,
        message: "Appearance settings updated successfully",
        data: { id: saved.id, key: saved.key, ...value },
      });
    } catch (error) {
      console.error("Error updating user appearance:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to update appearance settings",
      });
    }
  }

  // ── Get All Settings (for sidebar/overview) ─────────────────────────

  static async getAllSettings(req, res) {
    try {
      const allSettings = await prisma.platformSetting.findMany();
      const settingsMap = {};
      for (const s of allSettings) {
        settingsMap[s.key] = s.value;
      }
      return res.status(HttpStatus.OK).json({ status: true, data: settingsMap });
    } catch (error) {
      console.error("Error fetching all settings:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Failed to fetch settings",
      });
    }
  }
}

export default SettingsController;