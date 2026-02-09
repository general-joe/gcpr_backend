import prisma from "../../config/database.js";
import { processAssessment } from "../../services/assessment/assessment.service.js";

class AssessmentService {
  static async submitAssessment(user, data) {
    const assessment = await prisma.clinicalAssessment.create({
      data: {
        patientId: data.patientId,
        providerId: user.serviceProvider.id,
        toolCode: data.toolCode,
        toolVersion: data.toolVersion ?? "1.0.0",
        responses: data.responses,
        status: data.status ?? "COMPLETED",
        assessedAt: new Date()
      }
    });

    const scoring = processAssessment({
      toolCode: data.toolCode,
      responses: data.responses
    });

    const report = await prisma.clinicalAssessmentReport.create({
      data: {
        assessmentId: assessment.id,
        scores: scoring.result,
        summary: scoring.message ?? null
      }
    });

    return {
      assessment,
      report
    };
  }
}

export default AssessmentService;
