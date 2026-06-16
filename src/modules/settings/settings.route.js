import express from "express";
import rateLimit from "express-rate-limit";
import { authorize, authorizeOrRbacRole } from "../../middlewares/auth.js";
import SettingsController from "./settings.controller.js";

const settingsRouter = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

const adminAndProviderAuth = authorizeOrRbacRole(
  ["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"],
  ["ADMIN", "SERVICE_PROVIDER", "CAREGIVER"],
);

// ── All settings (overview) ─────────────────────────────────────────────
settingsRouter.get("/", limiter, adminAndProviderAuth, SettingsController.getAllSettings);

// ── Appointment Settings ────────────────────────────────────────────────
settingsRouter.get("/appointments", limiter, adminAndProviderAuth, SettingsController.getAppointmentSettings);
settingsRouter.put("/appointments", limiter, adminAndProviderAuth, SettingsController.updateAppointmentSettings);

// ── Provider Appointment Settings (per-provider, same response body) ────
settingsRouter.get("/provider-appointments", limiter, adminAndProviderAuth, SettingsController.getProviderAppointmentSettings);
settingsRouter.put("/provider-appointments", limiter, adminAndProviderAuth, SettingsController.updateProviderAppointmentSettings);

// ── Telehealth Settings ─────────────────────────────────────────────────
settingsRouter.get("/telehealth", limiter, adminAndProviderAuth, SettingsController.getTelehealthSettings);
settingsRouter.put("/telehealth", limiter, adminAndProviderAuth, SettingsController.updateTelehealthSettings);

// ── Platform General Settings ───────────────────────────────────────────
settingsRouter.get("/platform", limiter, adminAndProviderAuth, SettingsController.getPlatformGeneralSettings);
settingsRouter.put("/platform", limiter, adminAndProviderAuth, SettingsController.updatePlatformGeneralSettings);

// ── Workspace Settings ──────────────────────────────────────────────────
settingsRouter.get("/workspace", limiter, adminAndProviderAuth, SettingsController.getWorkspaceSettings);
settingsRouter.put("/workspace", limiter, adminAndProviderAuth, SettingsController.updateWorkspaceSettings);

// ── Security Settings ───────────────────────────────────────────────────
settingsRouter.get("/security", limiter, adminAndProviderAuth, SettingsController.getSecuritySettings);
settingsRouter.put("/security", limiter, adminAndProviderAuth, SettingsController.updateSecuritySettings);

// ── Referral Settings ───────────────────────────────────────────────────
settingsRouter.get("/referrals", limiter, adminAndProviderAuth, SettingsController.getReferralSettings);
settingsRouter.put("/referrals", limiter, adminAndProviderAuth, SettingsController.updateReferralSettings);

// ── Clinical Notes Settings ─────────────────────────────────────────────
settingsRouter.get("/clinical-notes", limiter, adminAndProviderAuth, SettingsController.getClinicalNotesSettings);
settingsRouter.put("/clinical-notes", limiter, adminAndProviderAuth, SettingsController.updateClinicalNotesSettings);

// ── Support Settings ────────────────────────────────────────────────────
settingsRouter.get("/support", limiter, adminAndProviderAuth, SettingsController.getSupportSettings);
settingsRouter.put("/support", limiter, adminAndProviderAuth, SettingsController.updateSupportSettings);

// ── Escalation Settings ─────────────────────────────────────────────────
settingsRouter.get("/escalations", limiter, adminAndProviderAuth, SettingsController.getEscalationSettings);
settingsRouter.put("/escalations", limiter, adminAndProviderAuth, SettingsController.updateEscalationSettings);

// ── Compliance Settings ─────────────────────────────────────────────────
settingsRouter.get("/compliance", limiter, adminAndProviderAuth, SettingsController.getComplianceSettings);
settingsRouter.put("/compliance", limiter, adminAndProviderAuth, SettingsController.updateComplianceSettings);

// ── Data Retention Settings ─────────────────────────────────────────────
settingsRouter.get("/data-retention", limiter, adminAndProviderAuth, SettingsController.getDataRetentionSettings);
settingsRouter.put("/data-retention", limiter, adminAndProviderAuth, SettingsController.updateDataRetentionSettings);

// ── Games Settings ──────────────────────────────────────────────────────
settingsRouter.get("/games", limiter, adminAndProviderAuth, SettingsController.getGamesSettings);
settingsRouter.put("/games", limiter, adminAndProviderAuth, SettingsController.updateGamesSettings);

// ── FAQ Settings ────────────────────────────────────────────────────────
settingsRouter.get("/faqs", limiter, adminAndProviderAuth, SettingsController.getFaqSettings);
settingsRouter.put("/faqs", limiter, adminAndProviderAuth, SettingsController.updateFaqSettings);

// ── User Appearance Settings ────────────────────────────────────────────
settingsRouter.get("/appearance/:userId", limiter, adminAndProviderAuth, SettingsController.getUserAppearance);
settingsRouter.put("/appearance/:userId", limiter, adminAndProviderAuth, SettingsController.updateUserAppearance);

export default settingsRouter;
