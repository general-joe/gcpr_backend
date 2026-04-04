import prisma from "../../config/database.js";
import {
  gmfm88Config,
  sltCpBaselineConfig,
  paediatricPhysiotherapyAssessmentConfig,
  homeRehabPharmacyConfig,
  cpProgramIntakeConfig,
  otCpClinicalAssessmentConfig,
  dietitianNutritionConsultationConfig
} from "../../config/tools/index.js";
import {
  processAssessment,
  getToolConfigByCode
} from "../../services/assessment/assessment.service.js";
import { generateReferralRecommendations } from "../../services/assessment/referral.engine.js";
import HttpStatus from "../../utils/http-status.js";

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
  dietitianNutritionConsultation: "DIETITIAN_NUTRITION_CONSULTATION"
};

const normalizeToolCode = (toolCode) => TOOL_ALIASES[toolCode] ?? toolCode;
const ALL_TOOL_CONFIGS = [
  gmfm88Config,
  sltCpBaselineConfig,
  paediatricPhysiotherapyAssessmentConfig,
  otCpClinicalAssessmentConfig,
  cpProgramIntakeConfig,
  homeRehabPharmacyConfig,
  dietitianNutritionConsultationConfig
];

const ITEM_TYPE_TO_FORMAT = {
  TEXT: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  DATE: "date",
  SELECT: "string"
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
  const dimensions = Array.isArray(toolConfig?.dimensions) ? toolConfig.dimensions : [];
  const itemLookup = buildItemLookup(toolConfig);

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
        expectedAnswerFormat: "number_or_NT",
        allowedValues: [0, 1, 2, 3, "NT"]
      });
    }

    return {
      sectionCode: dimension.code,
      sectionName: dimension.name,
      fields
    };
  });
};

const buildSectionFields = (toolConfig) => {
  const sections = Array.isArray(toolConfig?.sections) ? toolConfig.sections : [];
  return sections.map((section, sectionIndex) => ({
    sectionCode: section.code,
    sectionName: section.name,
    fields: (section.items ?? []).map((item, itemIndex) => ({
      fieldCode: `${sectionLetter(sectionIndex)}${itemIndex + 1}`,
      fieldKey: item.id,
      question: item.text ?? item.label ?? toTitleFromId(item.id),
      expectedAnswerFormat: ITEM_TYPE_TO_FORMAT[item.type] ?? "string",
      options: item.options ?? null
    }))
  }));
};

const buildFormSchema = (toolConfig) => {
  if (Array.isArray(toolConfig?.dimensions) && toolConfig.dimensions.length > 0) {
    return buildGMFMFields(toolConfig);
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

const GMFM_DIMENSIONS = [
  { code: "A", start: 1, end: 17 },
  { code: "B", start: 18, end: 37 },
  { code: "C", start: 38, end: 51 },
  { code: "D", start: 52, end: 64 },
  { code: "E", start: 65, end: 88 }
];

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
    const normalizedValue = typeof value === "string" && value !== "NT" ? Number(value) : value;
    const isValidNumeric = Number.isInteger(normalizedValue) && normalizedValue >= 0 && normalizedValue <= 3;

    if (!(VALID_GMFM_VALUES.has(value) || VALID_GMFM_VALUES.has(normalizedValue) || isValidNumeric)) {
      invalidValues.push(`${key}:${String(value)}`);
    }
  });

  const unknownKeys = Object.keys(responses).filter((key) => !expectedKeys.has(key));

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
      `Invalid GMFM-88 response payload: ${parts.join(", ")}`
    );
  }
};

class AssessmentService {
  static async getAvailableTools(user) {
    const serviceProvider = await AssessmentService.requireServiceProvider(user.id);

    const tools = ALL_TOOL_CONFIGS.map((toolConfig) => ({
      toolName: toolConfig.toolName,
      toolCode: toolConfig.toolCode,
      whoCanUseTool: getAllowedProfessions(toolConfig),
      canCurrentUserUse: getAllowedProfessions(toolConfig).includes(
        serviceProvider.profession
      )
    }));

    return {
      total: tools.length,
      tools
    };
  }

  static async getAssessmentFormByToolCode(user, toolCode) {
    await AssessmentService.requireServiceProvider(user.id);
    const normalizedToolCode = normalizeToolCode(toolCode);
    const { config: toolConfig } = getToolConfigByCode(normalizedToolCode);

    if (!toolConfig) {
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        `Assessment tool not found for code: ${toolCode}`
      );
    }

    return {
      toolName: toolConfig.toolName,
      toolCode: toolConfig.toolCode,
      version: toolConfig.version,
      sections: buildFormSchema(toolConfig)
    };
  }

  static async canProviderAccessPatient(providerId, patientId) {
    const [ownAssessmentsCount, referralCount, taskCount] = await Promise.all([
      prisma.clinicalAssessment.count({
        where: { patientId, providerId }
      }),
      prisma.clinicalReferral.count({
        where: {
          patientId,
          OR: [{ fromProviderId: providerId }, { toProviderId: providerId }]
        }
      }),
      prisma.rehabTask.count({
        where: { patientId, providerId }
      })
    ]);

    return ownAssessmentsCount > 0 || referralCount > 0 || taskCount > 0;
  }

  static async requireServiceProvider(userId) {
    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { userId }
    });

    if (!serviceProvider) {
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        "Service provider profile not found"
      );
    }

    return serviceProvider;
  }

  static async ensurePatientExists(patientId) {
    const patient = await prisma.cpPatient.findUnique({
      where: { id: patientId },
      select: { id: true }
    });

    if (!patient) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Patient not found");
    }
  }

  static async submitAssessment(user, data) {
    const serviceProvider = await AssessmentService.requireServiceProvider(user.id);
    await AssessmentService.ensurePatientExists(data.patientId);

    const normalizedToolCode = normalizeToolCode(data.toolCode);
    if (normalizedToolCode === "GMFM_88") {
      validateGMFMResponses(data.responses || {});
    }

    const { config: toolConfig } = getToolConfigByCode(normalizedToolCode);
    if (!toolConfig) {
      throw new gcprError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        `Unsupported assessment tool code: ${normalizedToolCode}`
      );
    }

    const allowedProfessions = getAllowedProfessions(toolConfig);
    if (
      allowedProfessions.length > 0 &&
      !allowedProfessions.includes(serviceProvider.profession)
    ) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        `Tool ${normalizedToolCode} is not available for profession ${serviceProvider.profession}`
      );
    }

    const scoring = processAssessment({
      toolCode: normalizedToolCode,
      responses: data.responses
    });

    const structuredReport = scoring.result?.scores
      ? scoring.result
      : {
          scores: scoring.result,
          summary: scoring.message ?? null,
          interpretation: null,
          recommendations: null
        };

    const result = await prisma.$transaction(async (tx) => {
      const assessment = await tx.clinicalAssessment.create({
        data: {
          patientId: data.patientId,
          providerId: serviceProvider.id,
          toolCode: normalizedToolCode,
          toolVersion: data.toolVersion ?? "1.0.0",
          responses: data.responses,
          status: data.status ?? "COMPLETED",
          assessedAt: new Date()
        }
      });

      const report = await tx.clinicalAssessmentReport.create({
        data: {
          assessmentId: assessment.id,
          scores: structuredReport.scores,
          summary: structuredReport.summary,
          interpretation: structuredReport.interpretation,
          recommendations: structuredReport.recommendations
        }
      });

      return {
        assessment,
        report
      };
    });

    return result;
  }

  static async createReferral(user, data) {
    const serviceProvider = await AssessmentService.requireServiceProvider(user.id);
    await AssessmentService.ensurePatientExists(data.patientId);

    if (serviceProvider.profession !== "PHYSIOTHERAPIST") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Only physiotherapists can create referrals"
      );
    }

    if (data.toProviderId) {
      const targetProvider = await prisma.serviceProvider.findUnique({
        where: { id: data.toProviderId },
        select: { id: true, profession: true }
      });

      if (!targetProvider) {
        throw new gcprError(HttpStatus.NOT_FOUND, "Referred provider not found");
      }

      if (targetProvider.profession !== data.toProfession) {
        throw new gcprError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "Selected provider profession does not match referral target profession"
        );
      }
    }

    if (data.assessmentId) {
      const assessment = await prisma.clinicalAssessment.findUnique({
        where: { id: data.assessmentId },
        select: {
          id: true,
          patientId: true,
          providerId: true,
          status: true,
          referralId: true
        }
      });

      if (!assessment) {
        throw new gcprError(HttpStatus.NOT_FOUND, "Assessment not found");
      }

      if (assessment.patientId !== data.patientId) {
        throw new gcprError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "Assessment does not belong to the selected patient"
        );
      }

      if (assessment.providerId !== serviceProvider.id) {
        throw new gcprError(
          HttpStatus.FORBIDDEN,
          "Only the assessment owner can attach referral to this assessment"
        );
      }

      if (assessment.status !== "COMPLETED") {
        throw new gcprError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "Referral can only be linked to a COMPLETED assessment"
        );
      }

      if (assessment.referralId) {
        throw new gcprError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "A referral is already linked to this assessment"
        );
      }
    }

    const referral = await prisma.$transaction(async (tx) => {
      const createdReferral = await tx.clinicalReferral.create({
        data: {
          patientId: data.patientId,
          fromProviderId: serviceProvider.id,
          toProviderId: data.toProviderId ?? null,
          toProfession: data.toProfession,
          reason: data.reason
        }
      });

      if (data.assessmentId) {
        await tx.clinicalAssessment.update({
          where: { id: data.assessmentId },
          data: { referralId: createdReferral.id }
        });
      }

      return createdReferral;
    });

    return referral;
  }

  static async getAssessmentReport(user, assessmentId) {
    const serviceProvider = await AssessmentService.requireServiceProvider(user.id);
    const assessment = await prisma.clinicalAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        reports: {
          orderBy: { createdAt: "desc" }
        },
        patient: {
          select: {
            id: true,
            fullName: true
          }
        },
        provider: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      }
    });

    if (!assessment) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Assessment not found");
    }

    const canAccess = await AssessmentService.canProviderAccessPatient(
      serviceProvider.id,
      assessment.patientId
    );
    if (!canAccess) {
      throw new gcprError(HttpStatus.FORBIDDEN, "Access to patient report denied");
    }

    if (!assessment.reports.length) {
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        "Clinical assessment report not found"
      );
    }

    return {
      assessment,
      report: assessment.reports[0]
    };
  }

  static async getAssessmentReportsByPatient(user, patientId) {
    const serviceProvider = await AssessmentService.requireServiceProvider(user.id);
    await AssessmentService.ensurePatientExists(patientId);

    const canAccess = await AssessmentService.canProviderAccessPatient(
      serviceProvider.id,
      patientId
    );
    if (!canAccess) {
      throw new gcprError(HttpStatus.FORBIDDEN, "Access to patient reports denied");
    }

    const assessments = await prisma.clinicalAssessment.findMany({
      where: { patientId },
      include: {
        reports: {
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { assessedAt: "desc" }
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
        report: item.reports[0] ?? null
      }))
    };
  }

  static async getIncomingReferrals(user) {
    const serviceProvider = await AssessmentService.requireServiceProvider(user.id);

    const referrals = await prisma.clinicalReferral.findMany({
      where: {
        OR: [
          { toProviderId: serviceProvider.id },
          {
            toProviderId: null,
            toProfession: serviceProvider.profession
          }
        ]
      },
      include: {
        patient: {
          select: { id: true, fullName: true }
        },
        fromProvider: {
          select: { id: true, profession: true, user: { select: { fullName: true } } }
        },
        relatedAssessment: {
          select: { id: true, toolCode: true, status: true, assessedAt: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      total: referrals.length,
      referrals
    };
  }

  static async getOutgoingReferrals(user) {
    const serviceProvider = await AssessmentService.requireServiceProvider(user.id);

    const referrals = await prisma.clinicalReferral.findMany({
      where: { fromProviderId: serviceProvider.id },
      include: {
        patient: {
          select: { id: true, fullName: true }
        },
        toProvider: {
          select: { id: true, profession: true, user: { select: { fullName: true } } }
        },
        relatedAssessment: {
          select: { id: true, toolCode: true, status: true, assessedAt: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      total: referrals.length,
      referrals
    };
  }

  static async updateReferralStatus(user, referralId, status) {
    const serviceProvider = await AssessmentService.requireServiceProvider(user.id);

    const referral = await prisma.clinicalReferral.findUnique({
      where: { id: referralId }
    });

    if (!referral) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Referral not found");
    }

    const isTargetProvider =
      referral.toProviderId === serviceProvider.id ||
      (referral.toProviderId === null &&
        referral.toProfession === serviceProvider.profession);

    if (!isTargetProvider) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Only the target provider can update this referral"
      );
    }

    const updated = await prisma.clinicalReferral.update({
      where: { id: referralId },
      data: { status }
    });

    return updated;
  }

  static async createRehabTaskFromReferral(user, referralId, data) {
    const serviceProvider = await AssessmentService.requireServiceProvider(user.id);

    const referral = await prisma.clinicalReferral.findUnique({
      where: { id: referralId },
      include: {
        patient: {
          select: { id: true, fullName: true }
        },
        fromProvider: {
          select: { id: true, user: { select: { fullName: true } } }
        }
      }
    });

    if (!referral) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Referral not found");
    }

    const isTargetProvider =
      referral.toProviderId === serviceProvider.id ||
      (referral.toProviderId === null &&
        referral.toProfession === serviceProvider.profession);

    if (!isTargetProvider) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Only the referred provider can assign tasks for this referral"
      );
    }

    if (referral.status !== "ACCEPTED") {
      throw new gcprError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Referral must be ACCEPTED before assigning rehab tasks"
      );
    }
    const videoUrl =
      data.videoUrl ?? data.video?.videoUrl ?? data.video?.url ?? null;
    const task = await prisma.rehabTask.create({
      data: {
        patientId: referral.patientId,
        providerId: serviceProvider.id,
        referralId: referral.id,
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
        status: "ASSIGNED"
      },
      include: {
        patient: {
          select: { id: true, fullName: true }
        }
      }
    });

    return task;
  }

  static async getReferralRecommendations(user, assessmentId) {
    const serviceProvider = await AssessmentService.requireServiceProvider(user.id);

    const assessment = await prisma.clinicalAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        reports: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });

    if (!assessment) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Assessment not found");
    }

    const canAccess = await AssessmentService.canProviderAccessPatient(
      serviceProvider.id,
      assessment.patientId
    );
    if (!canAccess) {
      throw new gcprError(HttpStatus.FORBIDDEN, "Access to patient denied");
    }

    const report = assessment.reports[0] ?? null;
    const scores = report?.scores ?? null;

    const recommendations = generateReferralRecommendations({
      toolCode: assessment.toolCode,
      scores
    });

    return {
      assessmentId: assessment.id,
      toolCode: assessment.toolCode,
      ...recommendations
    };
  }

  static async getMyAssignedTasks(user) {
    const serviceProvider = await AssessmentService.requireServiceProvider(user.id);

    const tasks = await prisma.rehabTask.findMany({
      where: { providerId: serviceProvider.id },
      include: {
        patient: {
          select: { id: true, fullName: true }
        },
        referral: {
          select: { id: true, status: true, fromProviderId: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      total: tasks.length,
      tasks
    };
  }
}

export default AssessmentService;
