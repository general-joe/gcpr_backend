import prisma from "../../config/database.js";
import NotificationService from "../notification/notification.service.js";
import {
  gmfm88Config,
  sltCpBaselineConfig,
  paediatricPhysiotherapyAssessmentConfig,
  homeRehabPharmacyConfig,
  cpProgramIntakeConfig,
  otCpClinicalAssessmentConfig,
  dietitianNutritionConsultationConfig,
} from "../../config/tools/index.js";
import {
  processAssessment,
  getToolConfigByCode,
} from "../../services/assessment/assessment.service.js";
import { generateReferralRecommendations } from "../../services/assessment/referral.engine.js";
import HttpStatus from "../../utils/http-status.js";
import { hasRbacRole } from "../../middlewares/auth.js";
import auditService from "../../services/audit/audit.service.js";
import {
  getPatientCaregiverUserId,
  userCanAccessPatient,
} from "../../services/clinical/clinicalAccess.service.js";

const buildSeverityAlert = (toolCode, report) => {
  const scores = report?.scores;
  if (!scores) return null;

  if (toolCode === "GMFM_88" && Number(scores.totalScore) < 30) {
    return `Severe GMFM-88 limitation detected: total score ${scores.totalScore}%. Urgent multidisciplinary review is recommended.`;
  }

  if (scores.modifiedAshworthScore >= 3) {
    return "High spasticity detected on OT assessment. Rehabilitation physician review should be considered.";
  }

  if (scores.adlAverageScore >= 2.5) {
    return "Severe ADL dependence detected. Caregiver training and intensive occupational therapy are recommended.";
  }

  return null;
};

const TOOL_ALIASES = {
  GMFM88: "GMFM_88",
  GMFM_88: "GMFM_88",
  "GMFM-88": "GMFM_88",
  gmfm88: "GMFM_88",
  gmfm_88: "GMFM_88",
  "gmfm-88": "GMFM_88",
  SLT_CP_BASELINE: "SLT_CP_BASELINE",
  "SLT-CP-BASELINE": "SLT_CP_BASELINE",
  slt_cp_baseline: "SLT_CP_BASELINE",
  "slt-cp-baseline": "SLT_CP_BASELINE",
  sltCpBaseline: "SLT_CP_BASELINE",
  PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT: "PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT",
  paediatric_physiotherapy_assessment: "PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT",
  "paediatric-physiotherapy-assessment": "PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT",
  HOME_REHAB_PHARMACY: "HOME_REHAB_PHARMACY",
  "HOME-REHAB-PHARMACY": "HOME_REHAB_PHARMACY",
  home_rehab_pharmacy: "HOME_REHAB_PHARMACY",
  "home-rehab-pharmacy": "HOME_REHAB_PHARMACY",
  homeRehabPharmacy: "HOME_REHAB_PHARMACY",
  CP_PROGRAM_INTAKE: "CP_PROGRAM_INTAKE",
  "CP-PROGRAM-INTAKE": "CP_PROGRAM_INTAKE",
  cp_program_intake: "CP_PROGRAM_INTAKE",
  "cp-program-intake": "CP_PROGRAM_INTAKE",
  cpProgramIntake: "CP_PROGRAM_INTAKE",
  OT_CP_CLINICAL_ASSESSMENT: "OT_CP_CLINICAL_ASSESSMENT",
  "OT-CP-CLINICAL-ASSESSMENT": "OT_CP_CLINICAL_ASSESSMENT",
  ot_cp_clinical_assessment: "OT_CP_CLINICAL_ASSESSMENT",
  "ot-cp-clinical-assessment": "OT_CP_CLINICAL_ASSESSMENT",
  otCpClinicalAssessment: "OT_CP_CLINICAL_ASSESSMENT",
  DIETITIAN_NUTRITION_CONSULTATION: "DIETITIAN_NUTRITION_CONSULTATION",
  "DIETITIAN-NUTRITION-CONSULTATION": "DIETITIAN_NUTRITION_CONSULTATION",
  dietitian_nutrition_consultation: "DIETITIAN_NUTRITION_CONSULTATION",
  "dietitian-nutrition-consultation": "DIETITIAN_NUTRITION_CONSULTATION",
  dietitianNutritionConsultation: "DIETITIAN_NUTRITION_CONSULTATION",
};

const normalizeToolCode = (toolCode) => TOOL_ALIASES[toolCode] ?? toolCode;
const ALL_TOOL_CONFIGS = [
  gmfm88Config,
  sltCpBaselineConfig,
  paediatricPhysiotherapyAssessmentConfig,
  otCpClinicalAssessmentConfig,
  cpProgramIntakeConfig,
  homeRehabPharmacyConfig,
  dietitianNutritionConsultationConfig,
];

const ITEM_TYPE_TO_FORMAT = {
  TEXT: "string",
  TEXTAREA: "textarea",
  NUMBER: "number",
  BOOLEAN: "boolean",
  DATE: "date",
  SELECT: "string",
  CHECKBOX: "checkbox",
  RADIO: "radio",
};

const toTitleFromId = (value) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

const sectionLetter = (index) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[index] ?? `S${index + 1}`;
};

const buildItemLookup = (toolConfig) => {
  const items = Array.isArray(toolConfig?.items) ? toolConfig.items : [];
  return new Map(items.map((item) => [item.id, item]));
};

const buildGMFMFields = (toolConfig) => {
  const dimensions = Array.isArray(toolConfig?.dimensions)
    ? toolConfig.dimensions
    : [];
  const itemLookup = buildItemLookup(toolConfig);
  const scoringKey = toolConfig?.scoringKey;
  const scoringOptions = scoringKey
    ? Object.entries(scoringKey).map(([code, label]) => ({
        label,
        value: String(code),
      }))
    : [];

  return dimensions.map((dimension) => {
    const [start, end] = dimension.itemRange;
    const fields = [];

    for (let itemNumber = start; itemNumber <= end; itemNumber += 1) {
      const fieldCode = `${dimension.code}${itemNumber}`;
      const itemDef = itemLookup.get(fieldCode);

      fields.push({
        fieldCode,
        question: itemDef?.text ?? `GMFM Item ${fieldCode}`,
        dimension: itemDef?.dimension ?? dimension.code,
        itemNumber: itemDef?.number ?? itemNumber,
        expectedAnswerFormat: scoringOptions.length > 0 ? "select" : "number_or_NT",
        options: scoringOptions,
        allowedValues: [0, 1, 2, 3, "NT"],
      });
    }

    return {
      sectionCode: dimension.code,
      sectionName: dimension.name,
      fields,
    };
  });
};

const buildSectionFields = (toolConfig) => {
  const sections = Array.isArray(toolConfig?.sections)
    ? toolConfig.sections
    : [];
  return sections.map((section, sectionIndex) => ({
    sectionCode: section.code,
    sectionName: section.name,
    fields: (section.items ?? []).map((item, itemIndex) => ({
      fieldCode: `${sectionLetter(sectionIndex)}${itemIndex + 1}`,
      fieldKey: item.id,
      question: item.text ?? item.label ?? toTitleFromId(item.id),
      expectedAnswerFormat: ITEM_TYPE_TO_FORMAT[item.type] ?? "string",
      options: item.options ?? null,
    })),
  }));
};

const buildFormSchema = (toolConfig) => {
  if (
    Array.isArray(toolConfig?.dimensions) &&
    toolConfig.dimensions.length > 0
  ) {
    const sections = buildGMFMFields(toolConfig);

    sections.push({
      sectionCode: "clinical_notes",
      sectionName: "Clinical Notes",
      description:
        "Indicate whether this assessment reflects the child's typical/regular performance.",
      fields: [
        {
          fieldCode: "clinical_notes_is_regular_performance",
          fieldKey: "isRegularPerformance",
          question:
            "Was this assessment indicative of this child's regular performance?",
          expectedAnswerFormat: "boolean",
          options: [
            { label: "YES", value: true },
            { label: "NO", value: false },
          ],
          required: false,
        },
        {
          fieldCode: "clinical_notes_comment",
          fieldKey: "clinicalNotesComment",
          question: "COMMENTS:",
          expectedAnswerFormat: "string",
          required: false,
        },
      ],
    });

    return sections;
  }

  if (Array.isArray(toolConfig?.sections) && toolConfig.sections.length > 0) {
    return buildSectionFields(toolConfig);
  }

  return [];
};

const getAllowedProfessions = (toolConfig) => {
  const professions = toolConfig?.metadata?.professions;
  const legacyProfession = toolConfig?.metadata?.profession;

  if (Array.isArray(professions) && professions.length > 0) {
    return professions;
  }

  if (legacyProfession) {
    return [legacyProfession];
  }

  return [];
};

const isAdminLikeUser = async (user, roles = ["ADMIN"]) => {
  if (!user) return false;

  const userType = String(user.userType || "").toUpperCase();
  if (roles.includes(userType)) return true;

  if (
    Array.isArray(user.roles) &&
    user.roles.some((role) => roles.includes(String(role).toUpperCase()))
  ) {
    return true;
  }

  return user.id ? hasRbacRole(user.id, roles) : false;
};

const GMFM_DIMENSIONS = [
  { code: "A", start: 1, end: 17 },
  { code: "B", start: 18, end: 37 },
  { code: "C", start: 38, end: 51 },
  { code: "D", start: 52, end: 64 },
  { code: "E", start: 65, end: 88 },
];

const EXTRA_GMFM_KEYS_ALLOWED = new Set([
  "isRegularPerformance",
  "clinicalNotesComment",
  "clinical_notes_is_regular_performance",
  "clinical_notes_comment",
]);

const VALID_GMFM_VALUES = new Set([0, 1, 2, 3, "NT"]);

const validateGMFMResponses = (responses) => {
  const expectedKeys = new Set();

  GMFM_DIMENSIONS.forEach(({ code, start, end }) => {
    for (let i = start; i <= end; i++) {
      expectedKeys.add(`${code}${i}`);
    }
  });

  const missingKeys = [];
  const invalidValues = [];

  expectedKeys.forEach((key) => {
    if (!(key in responses)) {
      missingKeys.push(key);
      return;
    }

    const value = responses[key];
    const normalizedValue =
      typeof value === "string" && value !== "NT" ? Number(value) : value;
    const isValidNumeric =
      Number.isInteger(normalizedValue) &&
      normalizedValue >= 0 &&
      normalizedValue <= 3;

    if (
      !(
        VALID_GMFM_VALUES.has(value) ||
        VALID_GMFM_VALUES.has(normalizedValue) ||
        isValidNumeric
      )
    ) {
      invalidValues.push(`${key}:${String(value)}`);
    }
  });

  const unknownKeys = Object.keys(responses).filter(
    (key) => !expectedKeys.has(key) && !EXTRA_GMFM_KEYS_ALLOWED.has(key),
  );

  if (missingKeys.length || invalidValues.length || unknownKeys.length) {
    const parts = [];
    if (missingKeys.length) {
      parts.push(`missing items (${missingKeys.length})`);
    }
    if (invalidValues.length) {
      parts.push(`invalid values (${invalidValues.length})`);
    }
    if (unknownKeys.length) {
      parts.push(`unknown items (${unknownKeys.length})`);
    }

    throw new gcprError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      `Invalid GMFM-88 response payload: ${parts.join(", ")}`,
    );
  }
};

class AssessmentService {
  static async getAvailableTools(user) {
    const serviceProvider =
      await AssessmentService.requireServiceProvider(user);

    // If user is admin, allow all tools
    const isAdmin = await isAdminLikeUser(user);

    // Gather all user roles (from user object and serviceProvider)
    const userRoles = new Set();
    if (user && Array.isArray(user.roles)) {
      user.roles.forEach((role) => userRoles.add(String(role).toUpperCase()));
    }
    if (serviceProvider && serviceProvider.profession) {
      userRoles.add(String(serviceProvider.profession).toUpperCase());
    }

    const tools = ALL_TOOL_CONFIGS.map((toolConfig) => {
      const allowed = getAllowedProfessions(toolConfig).map((r) =>
        String(r).toUpperCase(),
      );
      const canUse = isAdmin
        ? true
        : allowed.some((role) => userRoles.has(role));
      return {
        toolName: toolConfig.toolName,
        toolCode: toolConfig.toolCode,
        whoCanUseTool: getAllowedProfessions(toolConfig),
        canCurrentUserUse: canUse,
      };
    });

    return {
      total: tools.length,
      tools,
    };
  }

  static async getAssessmentFormByToolCode(user, toolCode) {
    await AssessmentService.requireServiceProvider(user);
    const normalizedToolCode = normalizeToolCode(toolCode);
    const { config: toolConfig } = getToolConfigByCode(normalizedToolCode);

    if (!toolConfig) {
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        `Assessment tool not found for code: ${toolCode}`,
      );
    }

    return {
      toolName: toolConfig.toolName,
      toolCode: toolConfig.toolCode,
      version: toolConfig.version,
      sections: buildFormSchema(toolConfig),
    };
  }

  static async canProviderAccessPatient(providerId, patientId) {
    const [ownAssessmentsCount, referralCount, taskCount] = await Promise.all([
      prisma.clinicalAssessment.count({
        where: { patientId, providerId },
      }),
      prisma.clinicalReferral.count({
        where: {
          patientId,
          OR: [{ fromProviderId: providerId }, { toProviderId: providerId }],
        },
      }),
      prisma.rehabTask.count({
        where: { patientId, providerId },
      }),
    ]);

    return ownAssessmentsCount > 0 || referralCount > 0 || taskCount > 0;
  }

  static async canAccessPatientReports(user, serviceProvider, patientId) {
    if (await isAdminLikeUser(user)) return true;
    if (serviceProvider.profession === "PHYSIOTHERAPIST") return true;
    if (await userCanAccessPatient(user, patientId)) return true;
    return AssessmentService.canProviderAccessPatient(serviceProvider.id, patientId);
  }

  /**
   * Allow Admins with certain roles to bypass service provider check.
   * @param {object|string|number} userOrUserId - user object or userId
   * @returns {object|null} serviceProvider or null for bypass
   */
  static async requireServiceProvider(userOrUserId) {
    let user = userOrUserId;
    let userId = userOrUserId;
    if (typeof userOrUserId === "object" && userOrUserId !== null) {
      user = userOrUserId;
      userId = user.id;
    } else {
      user = null;
    }

    const isAdminUserType =
      user && user.userType && user.userType.toUpperCase() === "ADMIN";
    const isAdminRbac =
      !isAdminUserType &&
      user &&
      (await hasRbacRole(userId, ["ADMIN", "TESTER"]));

    const bypassVerification = isAdminUserType || isAdminRbac;

    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { userId },
    });

    if (!serviceProvider) {
      if (bypassVerification) {
        return {
          id: userId,
          profession: "ADMIN",
          verificationStatus: "VERIFIED",
        };
      }
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        "Service provider profile not found",
      );
    }

    if (bypassVerification) {
      return {
        ...serviceProvider,
        verificationStatus: "VERIFIED",
      };
    }

    return serviceProvider;
  }

  // Requires profile AND verified status — use for clinical write actions
  static async requireVerifiedServiceProvider(userOrUserId) {
    // Accept either user object or userId
    let user = userOrUserId;
    let userId = userOrUserId;
    if (typeof userOrUserId === "object" && userOrUserId !== null) {
      user = userOrUserId;
      userId = user.id;
    } else {
      user = null;
    }

    const isAdminUserType =
      user && user.userType && user.userType.toUpperCase() === "ADMIN";
    const isAdminRbac =
      !isAdminUserType &&
      user &&
      (await hasRbacRole(userId, ["ADMIN", "TESTER"]));

    if (isAdminUserType || isAdminRbac) {
      const realProvider = await prisma.serviceProvider.findUnique({
        where: { userId },
        select: { id: true, profession: true, verificationStatus: true },
      });

      if (realProvider && realProvider.verificationStatus === "VERIFIED") {
        return realProvider;
      }

      return {
        id: userId,
        profession: realProvider?.profession ?? "ADMIN",
        verificationStatus: "VERIFIED",
      };
    }

    const serviceProvider =
      await AssessmentService.requireServiceProvider(userId);
    if (serviceProvider.verificationStatus !== "VERIFIED") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Your account is pending verification. Contact admin to complete verification before performing clinical actions.",
      );
    }
    return serviceProvider;
  }

  static async ensurePatientExists(patientId) {
    const patient = await prisma.cpPatient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Patient not found");
    }
  }

  static async submitAssessment(user, data) {
    const serviceProvider =
      await AssessmentService.requireVerifiedServiceProvider(user);
    await AssessmentService.ensurePatientExists(data.patientId);

    const normalizedToolCode = normalizeToolCode(data.toolCode);
    const responses = data.responses || {};
    if (normalizedToolCode === "GMFM_88") {
      validateGMFMResponses(responses);
    }

    const { config: toolConfig } = getToolConfigByCode(normalizedToolCode);
    if (!toolConfig) {
      throw new gcprError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        `Unsupported assessment tool code: ${normalizedToolCode}`,
      );
    }

    const allowedProfessions = getAllowedProfessions(toolConfig);
    // Admin users can use any tool.
    const isAdmin = await isAdminLikeUser(user, ["ADMIN", "TESTER"]);
    if (
      !isAdmin &&
      allowedProfessions.length > 0 &&
      !allowedProfessions.includes(serviceProvider.profession)
    ) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        `Tool ${normalizedToolCode} is not available for profession ${serviceProvider.profession}`,
      );
    }

    // ClinicalAssessment.providerId must reference a real service provider.
    // Admin accounts can bypass profession checks, but still need a valid
    // provider record for attribution and relational integrity.
    let providerId = serviceProvider.id;
    if (isAdmin && serviceProvider.id === user.id) {
      let adminProvider = await prisma.serviceProvider.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!adminProvider) {
        adminProvider = await prisma.serviceProvider.findFirst({
          where: {
            verificationStatus: "VERIFIED",
            ...(allowedProfessions.length > 0
              ? { profession: { in: allowedProfessions } }
              : {}),
          },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
      }

      if (!adminProvider) {
        adminProvider = await prisma.serviceProvider.findFirst({
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
      }

      if (!adminProvider) {
        throw new gcprError(
          HttpStatus.FORBIDDEN,
          "No service provider profile is available to record this assessment.",
        );
      }

      providerId = adminProvider.id;
    }

    if (data.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: data.appointmentId },
        select: { id: true, patientId: true, providerId: true },
      });

      if (!appointment) {
        throw new gcprError(HttpStatus.NOT_FOUND, "Appointment not found");
      }

      if (appointment.patientId !== data.patientId || appointment.providerId !== providerId) {
        throw new gcprError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "Appointment does not match the selected patient and provider",
        );
      }
    }

    const scoring = processAssessment({
      toolCode: normalizedToolCode,
      responses,
    });

    const structuredReport = scoring.result?.scores
      ? scoring.result
      : {
          scores: scoring.result,
          summary: scoring.message ?? null,
          interpretation: null,
          recommendations: null,
        };

    const result = await prisma.$transaction(async (tx) => {
      const assessment = await tx.clinicalAssessment.create({
        data: {
          patientId: data.patientId,
          providerId: providerId,
          toolCode: normalizedToolCode,
          toolVersion: data.toolVersion ?? "1.0.0",
          responses: {
            ...responses,
            isRegularPerformance: data.isRegularPerformance,
            clinicalNotesComment: data.clinicalNotesComment,
          },
          appointmentId: data.appointmentId ?? null,
          status: data.status ?? "COMPLETED",
          assessedAt: new Date(),
        },
      });

      const report = await tx.clinicalAssessmentReport.create({
        data: {
          assessmentId: assessment.id,
          scores: structuredReport.scores,
          summary: structuredReport.summary,
          interpretation: structuredReport.interpretation,
          recommendations: structuredReport.recommendations,
        },
      });

      return {
        assessment,
        report,
      };
    });

    // Notify patient/caregiver on assessment submission
    try {
      const caregiverUserId = await getPatientCaregiverUserId(data.patientId);
      if (caregiverUserId) {
        await NotificationService.createNotification({
          userId: caregiverUserId,
          type: "IN_APP",
          category: "SYSTEM",
          title: "Assessment Submitted",
          content: `A new assessment has been submitted for you by your provider.`,
          relatedId: result.assessment.id,
          relatedModel: "ClinicalAssessment",
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        });
      }
    } catch (e) {
      // Log but do not block
      console.error(
        "[Notification] Assessment submission notification failed:",
        e.message,
      );
    }

    const severityAlert = buildSeverityAlert(normalizedToolCode, structuredReport);
    if (severityAlert) {
      await NotificationService.createNotification({
        userId: user.id,
        type: "IN_APP",
        category: "SYSTEM",
        title: "Clinical Severity Alert",
        content: severityAlert,
        relatedId: result.assessment.id,
        relatedModel: "ClinicalAssessment",
      });
    }

    return result;
  }

  static async createReferral(user, data) {
    const serviceProvider =
      await AssessmentService.requireVerifiedServiceProvider(user);

    const isAdminLike = await isAdminLikeUser(user, ["ADMIN", "TESTER"]);

    if (!isAdminLike && serviceProvider.profession !== "PHYSIOTHERAPIST") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Only physiotherapists can create referrals",
      );
    }

    let fromProviderId = serviceProvider.id;
    if (isAdminLike && (!serviceProvider.id || serviceProvider.id === user.id)) {
      const realProvider = await prisma.serviceProvider.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      if (!realProvider) {
        throw new gcprError(
          HttpStatus.FORBIDDEN,
          "No service provider profile is available to record this referral.",
        );
      }

      fromProviderId = realProvider.id;
    }

    if (data.assessmentId) {
      const assessment = await prisma.clinicalAssessment.findUnique({
        where: { id: data.assessmentId },
        select: {
          id: true,
          patientId: true,
          providerId: true,
          status: true,
          referralId: true,
        },
      });

      if (!assessment) {
        throw new gcprError(HttpStatus.NOT_FOUND, "Assessment not found");
      }

      if (assessment.patientId !== data.patientId) {
        throw new gcprError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "Assessment does not belong to the selected patient",
        );
      }

      if (!isAdminLike && assessment.providerId !== serviceProvider.id) {
        throw new gcprError(
          HttpStatus.FORBIDDEN,
          "Only the assessment owner can attach referral to this assessment",
        );
      }

      if (assessment.status !== "COMPLETED") {
        throw new gcprError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "Referral can only be linked to a COMPLETED assessment",
        );
      }

      if (assessment.referralId && assessment.status !== "REJECTED") {
        throw new gcprError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "A referral is already linked to this assessment",
        );
      }
    }

    const referral = await prisma.$transaction(async (tx) => {
      const slaDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const createdReferral = await tx.clinicalReferral.create({
        data: {
          patientId: data.patientId,
          fromProviderId,
          toProviderId: data.toProviderId ?? null,
          toProfession: data.toProfession,
          reason: data.reason,
          slaDeadline,
        },
      });

      if (data.assessmentId) {
        await tx.clinicalAssessment.update({
          where: { id: data.assessmentId },
          data: { referralId: createdReferral.id },
        });
      }

      return createdReferral;
    });

    // Notify referred provider (if direct)
    try {
      if (data.toProviderId) {
        const provider = await prisma.serviceProvider.findUnique({
          where: { id: data.toProviderId },
          select: { userId: true },
        });
        if (provider && provider.userId) {
          await NotificationService.createNotification({
            userId: provider.userId,
            type: "IN_APP",
            category: "SYSTEM",
            title: "New Referral",
            content: `You have received a new referral for patient assessment.`,
            relatedId: referral.id,
            relatedModel: "ClinicalReferral",
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          });
        }
      }
    } catch (e) {
      console.error("[Notification] Referral notification failed:", e.message);
    }

    return referral;
  }

  static async getAssessmentReport(user, assessmentId) {
    const serviceProvider =
      await AssessmentService.requireServiceProvider(user);
    const assessment = await prisma.clinicalAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        reports: {
          orderBy: { createdAt: "desc" },
        },
        patient: {
          select: {
            id: true,
            fullName: true,
          },
        },
        provider: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Assessment not found");
    }

    const isAdmin = await isAdminLikeUser(user);
    if (!isAdmin) {
      const canAccess = await AssessmentService.canAccessPatientReports(
        user,
        serviceProvider,
        assessment.patientId,
      );
      if (!canAccess) {
        throw new gcprError(
          HttpStatus.FORBIDDEN,
          "Access to patient report denied",
        );
      }
    }

    if (!assessment.reports.length) {
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        "Clinical assessment report not found",
      );
    }

    await auditService.write({
      timestamp: new Date().toISOString(),
      requestId: `CLINICAL-${Date.now()}`,
      userId: user.id,
      userRole: user.userType,
      method: "READ",
      path: `/assessment/${assessmentId}/report`,
      statusCode: 200,
      durationMs: 0,
      ipAddress: null,
      userAgent: null,
      eventType: "CLINICAL_RECORD_ACCESS",
      params: { assessmentId, patientId: assessment.patientId },
    });

    return {
      assessment,
      report: assessment.reports[0],
    };
  }

  static async getAssessmentReportsByPatient(user, patientId) {
    const serviceProvider =
      await AssessmentService.requireServiceProvider(user);
    await AssessmentService.ensurePatientExists(patientId);

    const isAdmin = await isAdminLikeUser(user);
    if (!isAdmin) {
      const canAccess = await AssessmentService.canAccessPatientReports(
        user,
        serviceProvider,
        patientId,
      );
      if (!canAccess) {
        throw new gcprError(
          HttpStatus.FORBIDDEN,
          "Access to patient reports denied",
        );
      }
    }

    const assessments = await prisma.clinicalAssessment.findMany({
      where: { patientId },
      include: {
        reports: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { assessedAt: "desc" },
    });

    await auditService.write({
      timestamp: new Date().toISOString(),
      requestId: `CLINICAL-${Date.now()}`,
      userId: user.id,
      userRole: user.userType,
      method: "READ",
      path: `/assessment/patient/${patientId}/reports`,
      statusCode: 200,
      durationMs: 0,
      ipAddress: null,
      userAgent: null,
      eventType: "CLINICAL_RECORD_ACCESS",
      params: { patientId, totalAssessments: assessments.length },
    });

    return {
      patientId,
      totalAssessments: assessments.length,
      assessments: assessments.map((item) => ({
        id: item.id,
        toolCode: item.toolCode,
        toolVersion: item.toolVersion,
        status: item.status,
        assessedAt: item.assessedAt,
        report: item.reports[0] ?? null,
      })),
    };
  }

  static async getIncomingReferrals(user) {
    // Check if user is admin (can view all referrals)
    const isAdmin = await isAdminLikeUser(user, ["ADMIN", "TESTER"]);
    
    let whereCondition;
    if (isAdmin) {
      // Admin users can see all incoming referrals (where toProvider is set or profession is targeted)
      whereCondition = {};
    } else {
      const serviceProvider =
        await AssessmentService.requireServiceProvider(user);
      whereCondition = {
        OR: [
          { toProviderId: serviceProvider.id },
          {
            toProviderId: null,
            toProfession: serviceProvider.profession,
          },
        ],
      };
    }

    const referrals = await prisma.clinicalReferral.findMany({
      where: whereCondition,
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
        fromProvider: {
          select: {
            id: true,
            profession: true,
            user: { select: { fullName: true } },
          },
        },
        relatedAssessment: {
          select: { id: true, toolCode: true, status: true, assessedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      total: referrals.length,
      referrals,
    };
  }

  static async getOutgoingReferrals(user) {
    // Check if user is admin (can view all referrals)
    const isAdmin = await isAdminLikeUser(user, ["ADMIN", "TESTER"]);
    
    let whereCondition;
    if (isAdmin) {
      // Admin users can see all outgoing referrals
      whereCondition = {};
    } else {
      const serviceProvider =
        await AssessmentService.requireServiceProvider(user);
      whereCondition = { fromProviderId: serviceProvider.id };
    }

    const referrals = await prisma.clinicalReferral.findMany({
      where: whereCondition,
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
        toProvider: {
          select: {
            id: true,
            profession: true,
            user: { select: { fullName: true } },
          },
        },
        relatedAssessment: {
          select: { id: true, toolCode: true, status: true, assessedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      total: referrals.length,
      referrals,
    };
  }

  static async updateReferralStatus(user, referralId, status) {
    const serviceProvider =
      await AssessmentService.requireServiceProvider(user);

    const referral = await prisma.clinicalReferral.findUnique({
      where: { id: referralId },
    });

    if (!referral) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Referral not found");
    }

    const isAdminLike = await isAdminLikeUser(user, ["ADMIN", "TESTER"]);

    let resolvedProviderId = serviceProvider.id;
    if (isAdminLike) {
      let realProvider = serviceProvider;
      if (!realProvider || typeof realProvider.id !== 'string' || realProvider.id === user.id) {
        realProvider = await prisma.serviceProvider.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
      }

      if (!realProvider) {
        realProvider = await prisma.serviceProvider.findFirst({
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });
      }

      if (!realProvider) {
        throw new gcprError(
          HttpStatus.FORBIDDEN,
          "No service provider profile is available to update this referral.",
        );
      }

      resolvedProviderId = realProvider.id;
    }

    const isTargetProvider =
      referral.toProviderId === resolvedProviderId ||
      (referral.toProviderId === null &&
        referral.toProfession === serviceProvider.profession);

    const isSenderProvider = referral.fromProviderId === resolvedProviderId;

    if (!isTargetProvider && !isSenderProvider) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Only the target provider or referring provider can update this referral",
      );
    }

    if (status === 'DECLINED' || status === 'EXPIRED') {
      await prisma.rehabTask.updateMany({
        where: { referralId, status: { in: ['PENDING', 'ASSIGNED'] } },
        data: { status: 'CANCELLED' },
      });
    }

    const updated = await prisma.clinicalReferral.update({
      where: { id: referralId },
      data: { status },
    });

    return updated;
  }

  static async createRehabTaskFromReferral(user, referralId, data) {
    const serviceProvider =
      await AssessmentService.requireVerifiedServiceProvider(user);
    const isAdminLike = await isAdminLikeUser(user, ["ADMIN", "TESTER"]);

    let resolvedProviderId = serviceProvider.id;
    if (isAdminLike && (!serviceProvider.id || serviceProvider.id === user.id)) {
      const realProvider = await prisma.serviceProvider.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      if (!realProvider) {
        throw new gcprError(
          HttpStatus.FORBIDDEN,
          "No service provider profile is available to assign this task.",
        );
      }

      resolvedProviderId = realProvider.id;
    }

    const referral = await prisma.clinicalReferral.findUnique({
      where: { id: referralId },
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
        fromProvider: {
          select: { id: true, user: { select: { fullName: true } } },
        },
        relatedAssessment: {
          select: { id: true },
        },
      },
    });

    if (!referral) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Referral not found");
    }

    const isTargetProvider =
      referral.toProviderId === resolvedProviderId ||
      (referral.toProviderId === null &&
        referral.toProfession === serviceProvider.profession);

    const isSenderProvider = referral.fromProviderId === resolvedProviderId;

    if (!isTargetProvider && !isSenderProvider) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Only the referred provider or referring provider can assign tasks for this referral",
      );
    }

    if (referral.status !== "ACCEPTED") {
      throw new gcprError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Referral must be ACCEPTED before assigning rehab tasks",
      );
    }

    let carePlan;
    if (data.carePlanId) {
      carePlan = await prisma.carePlan.findUnique({
        where: { id: data.carePlanId },
        select: {
          id: true,
          patientId: true,
          assessmentId: true,
          status: true,
          primaryProviderId: true,
        },
      });
    } else {
      carePlan = await prisma.carePlan.findFirst({
        where: {
          patientId: referral.patientId,
          status: "ACTIVE",
          ...(referral.relatedAssessment?.id && {
            assessmentId: referral.relatedAssessment.id,
          }),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          patientId: true,
          assessmentId: true,
          status: true,
          primaryProviderId: true,
        },
      });
    }

    if (!carePlan) {
      throw new gcprError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "An active care plan is required before assigning rehab tasks",
      );
    }

    if (carePlan.patientId !== referral.patientId) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "Care plan does not belong to the referred patient",
      );
    }

    if (
      referral.relatedAssessment?.id &&
      carePlan.assessmentId !== referral.relatedAssessment.id
    ) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "Care plan must be generated from the referral assessment before creating tasks",
      );
    }

    const videoUrl =
      data.videoUrl ?? data.video?.videoUrl ?? data.video?.url ?? null;
    const task = await prisma.rehabTask.create({
      data: {
        patientId: referral.patientId,
        providerId: serviceProvider.id,
        referralId: referral.id,
        carePlanId: carePlan.id,
        title: data.title,
        instructions: data.instructions,
        instructionSteps: data.instructionSteps ?? null,
        frequencyPerDay: data.frequencyPerDay ?? null,
        frequencyNote: data.frequencyNote ?? null,
        durationDays: data.durationDays,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        videoUrl,
        progress: 0,
        status: "ASSIGNED",
      },
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
        carePlan: {
          select: { id: true, assessmentId: true, status: true },
        },
      },
    });

    // Notify patient/caregiver on rehab task assignment
    try {
      const { default: AdherenceService } =
        await import("./adherence.service.js");
      await AdherenceService.generateAdherenceLogs(task);
    } catch (e) {
      console.error("[AdherenceLogs] Auto-generation failed:", e.message);
    }

    // Notify patient/caregiver on rehab task assignment
    try {
      const caregiverUserId = await getPatientCaregiverUserId(referral.patientId);
      if (caregiverUserId) {
        await NotificationService.createNotification({
          userId: caregiverUserId,
          type: "IN_APP",
          category: "TASK_REMINDER",
          title: "New Rehab Task Assigned",
          content: `A new rehab task has been assigned to you by your provider.`,
          relatedId: task.id,
          relatedModel: "RehabTask",
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        });
      }
    } catch (e) {
      console.error(
        "[Notification] Rehab task notification failed:",
        e.message,
      );
    }

    return task;
  }

  static async getReferralRecommendations(user, assessmentId) {
    const serviceProvider =
      await AssessmentService.requireServiceProvider(user);

    const assessment = await prisma.clinicalAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        reports: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!assessment) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Assessment not found");
    }

    const isAdmin = await isAdminLikeUser(user);
    if (!isAdmin) {
      const canAccess = await AssessmentService.canProviderAccessPatient(
        serviceProvider.id,
        assessment.patientId,
      );
      if (!canAccess) {
        throw new gcprError(HttpStatus.FORBIDDEN, "Access to patient denied");
      }
    }

    const report = assessment.reports[0] ?? null;
    const scores = report?.scores ?? null;

    const recommendations = generateReferralRecommendations({
      toolCode: assessment.toolCode,
      scores,
    });

    return {
      assessmentId: assessment.id,
      toolCode: assessment.toolCode,
      ...recommendations,
    };
  }

  static async getMyAssignedTasks(user) {
    const serviceProvider =
      await AssessmentService.requireServiceProvider(user);

    const tasks = await prisma.rehabTask.findMany({
      where: { providerId: serviceProvider.id },
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
        referral: {
          select: { id: true, status: true, fromProviderId: true },
        },
        carePlan: {
          select: { id: true, assessmentId: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      total: tasks.length,
      tasks,
    };
  }

  static async updateAssessmentStatus(user, assessmentId, status, comment) {
    const isAdmin = await isAdminLikeUser(user);
    const serviceProvider = isAdmin
      ? null
      : await AssessmentService.requireServiceProvider(user);

    const assessment = await prisma.clinicalAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        reports: true,
        patient: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!assessment) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Assessment not found");
    }

    if (!isAdmin && assessment.providerId !== serviceProvider.id) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Only the assessment creator or admin can update status",
      );
    }

    if (!["PENDING_REVIEW", "REVIEWED", "REVIEWED_NEEDS_REVISION", "APPROVED"].includes(status)) {
      throw new gcprError(HttpStatus.BAD_REQUEST, "Unsupported assessment status");
    }

    const updated = await prisma.clinicalAssessment.update({
      where: { id: assessmentId },
      data: {
        status,
        ...(comment ? { clinicalNotesComment: comment } : {}),
      },
      include: {
        reports: true,
        patient: { select: { id: true, fullName: true } },
        provider: { select: { user: { select: { id: true, fullName: true } } } },
      },
    });

    if (
      status === "APPROVED" &&
      (!updated.reports || updated.reports.length === 0)
    ) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "Cannot approve an assessment without a report",
      );
    }

    return {
      assessment: updated,
      report: updated.reports[0] ?? null,
    };
  }
}

export default AssessmentService;
