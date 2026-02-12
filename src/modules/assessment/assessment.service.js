import prisma from "../../config/database.js";
import { processAssessment } from "../../services/assessment/assessment.service.js";
import HttpStatus from "../../utils/http-status.js";

const TOOL_ALIASES = {
  GMFM88: "GMFM_88",
  GMFM_88: "GMFM_88",
  "GMFM-88": "GMFM_88",
  gmfm88: "GMFM_88",
  gmfm_88: "GMFM_88",
  "gmfm-88": "GMFM_88"
};

const normalizeToolCode = (toolCode) => TOOL_ALIASES[toolCode] ?? toolCode;

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
  static async submitAssessment(user, data) {
    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id }
    });

    if (!serviceProvider) {
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        "Service provider profile not found"
      );
    }

    const normalizedToolCode = normalizeToolCode(data.toolCode);
    if (normalizedToolCode === "GMFM_88") {
      validateGMFMResponses(data.responses || {});
    }

    const assessment = await prisma.clinicalAssessment.create({
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

    const report = await prisma.clinicalAssessmentReport.create({
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
  }

  static async getAssessmentReport(assessmentId) {
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

  static async getAssessmentReportsByPatient(patientId) {
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
}

export default AssessmentService;
