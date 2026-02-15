import prisma from "../../config/database.js";
import {
  processAssessment,
  getToolConfigByCode
} from "../../services/assessment/assessment.service.js";
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
  OT_CP_CLINICAL_ASSESSMENT: "OT_CP_CLINICAL_ASSESSMENT",
  ot_cp_clinical_assessment: "OT_CP_CLINICAL_ASSESSMENT",
  "ot-cp-clinical-assessment": "OT_CP_CLINICAL_ASSESSMENT",
  CP_PROGRAM_INTAKE: "CP_PROGRAM_INTAKE",
  cp_program_intake: "CP_PROGRAM_INTAKE",
  "cp-program-intake": "CP_PROGRAM_INTAKE",
  HOME_REHAB_PHARMACY_PRESCRIPTION: "HOME_REHAB_PHARMACY_PRESCRIPTION",
  home_rehab_pharmacy_prescription: "HOME_REHAB_PHARMACY_PRESCRIPTION",
  "home-rehab-pharmacy-prescription": "HOME_REHAB_PHARMACY_PRESCRIPTION"
};

const normalizeToolCode = (toolCode) => TOOL_ALIASES[toolCode] ?? toolCode;

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

    if (data.referral && serviceProvider.profession !== "PHYSIOTHERAPIST") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Only physiotherapists can create referrals from assessment submission"
      );
    }

    if (data.referral && (data.status ?? "COMPLETED") !== "COMPLETED") {
      throw new gcprError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Referral can only be created when assessment status is COMPLETED"
      );
    }

    if (data.referral) {
      const targetProvider = await prisma.serviceProvider.findUnique({
        where: { id: data.referral.toProviderId },
        select: { id: true, profession: true }
      });

      if (!targetProvider) {
        throw new gcprError(HttpStatus.NOT_FOUND, "Referred provider not found");
      }

      if (targetProvider.profession !== data.referral.toProfession) {
        throw new gcprError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "Selected provider profession does not match referral target profession"
        );
      }

      if (targetProvider.id === serviceProvider.id) {
        throw new gcprError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "Cannot refer a patient to the same provider"
        );
      }
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
      let referral = null;
      if (data.referral) {
        referral = await tx.clinicalReferral.create({
          data: {
            patientId: data.patientId,
            fromProviderId: serviceProvider.id,
            toProviderId: data.referral.toProviderId,
            toProfession: data.referral.toProfession,
            reason: data.referral.reason
          }
        });
      }

      const assessment = await tx.clinicalAssessment.create({
        data: {
          patientId: data.patientId,
          providerId: serviceProvider.id,
          toolCode: normalizedToolCode,
          toolVersion: data.toolVersion ?? "1.0.0",
          responses: data.responses,
          status: data.status ?? "COMPLETED",
          assessedAt: new Date(),
          referralId: referral?.id
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
        report,
        referral
      };
    });

    return result;
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
        video: data.video ?? null,
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
