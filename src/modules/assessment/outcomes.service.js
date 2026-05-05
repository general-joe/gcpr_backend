import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";

function computeOutcomeDirection(baselineLevel, currentLevel) {
  if (currentLevel < baselineLevel) return "IMPROVED"; // lower GMFCS = better
  if (currentLevel > baselineLevel) return "REGRESSED";
  return "STABLE";
}

function computePercentageChange(baselineLevel, currentLevel) {
  if (baselineLevel === 0) return 0;
  return parseFloat((((baselineLevel - currentLevel) / baselineLevel) * 100).toFixed(2));
}

class OutcomesService {
  static async requireServiceProvider(userId) {
    const sp = await prisma.serviceProvider.findUnique({ where: { userId }, select: { id: true } });
    if (!sp) throw new gcprError(HttpStatus.NOT_FOUND, "Service provider profile not found");
    return sp;
  }

  static async listPatientOutcomes(user, patientId, query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const patient = await prisma.cpPatient.findUnique({ where: { id: patientId }, select: { id: true } });
    if (!patient) throw new gcprError(HttpStatus.NOT_FOUND, "Patient not found");

    const [outcomes, total] = await Promise.all([
      prisma.motorFunctionOutcome.findMany({
        where: { patientId },
        skip,
        take,
        orderBy: { reviewDate: "desc" },
        include: {
          assessor: {
            select: { id: true, profession: true, user: { select: { fullName: true } } }
          }
        }
      }),
      prisma.motorFunctionOutcome.count({ where: { patientId } })
    ]);

    return {
      data: outcomes,
      pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) }
    };
  }

  static async getLatestOutcome(user, patientId) {
    const patient = await prisma.cpPatient.findUnique({ where: { id: patientId }, select: { id: true } });
    if (!patient) throw new gcprError(HttpStatus.NOT_FOUND, "Patient not found");

    const outcome = await prisma.motorFunctionOutcome.findFirst({
      where: { patientId },
      orderBy: { reviewDate: "desc" },
      include: {
        assessor: {
          select: { id: true, profession: true, user: { select: { fullName: true } } }
        }
      }
    });

    if (!outcome) throw new gcprError(HttpStatus.NOT_FOUND, "No outcomes found for this patient");
    return outcome;
  }

  static async getProviderSummary(user) {
    const sp = await OutcomesService.requireServiceProvider(user.id);

    const outcomes = await prisma.motorFunctionOutcome.findMany({
      where: { assessorId: sp.id },
      select: { outcomeDirection: true }
    });

    const totalImproved = outcomes.filter(o => o.outcomeDirection === "IMPROVED").length;
    const totalStable = outcomes.filter(o => o.outcomeDirection === "STABLE").length;
    const totalRegressed = outcomes.filter(o => o.outcomeDirection === "REGRESSED").length;
    const total = outcomes.length;
    const improvementRate = total > 0 ? Math.round((totalImproved / total) * 100) : 0;

    return { totalImproved, totalStable, totalRegressed, improvementRate };
  }

  static async getOutcomeById(user, outcomeId) {
    const outcome = await prisma.motorFunctionOutcome.findUnique({
      where: { id: outcomeId },
      include: {
        assessor: { select: { id: true, profession: true, user: { select: { fullName: true } } } },
        patient: { select: { id: true, fullName: true } }
      }
    });
    if (!outcome) throw new gcprError(HttpStatus.NOT_FOUND, "Outcome record not found");
    return outcome;
  }

  static async createOutcome(user, data) {
    const sp = await OutcomesService.requireServiceProvider(user.id);

    const patient = await prisma.cpPatient.findUnique({ where: { id: data.patientId }, select: { id: true } });
    if (!patient) throw new gcprError(HttpStatus.NOT_FOUND, "Patient not found");

    const outcomeDirection = computeOutcomeDirection(data.baselineLevel, data.currentLevel);
    const percentageChange = computePercentageChange(data.baselineLevel, data.currentLevel);

    return prisma.motorFunctionOutcome.create({
      data: {
        patientId: data.patientId,
        assessorId: sp.id,
        baselineLevel: data.baselineLevel,
        currentLevel: data.currentLevel,
        baselineDate: new Date(data.baselineDate),
        reviewDate: new Date(data.reviewDate),
        outcomeDirection,
        percentageChange,
        notes: data.notes || null,
        assessmentToolUsed: data.assessmentToolUsed || null
      }
    });
  }

  static async updateOutcome(user, outcomeId, data) {
    const sp = await OutcomesService.requireServiceProvider(user.id);
    const outcome = await prisma.motorFunctionOutcome.findUnique({ where: { id: outcomeId } });
    if (!outcome) throw new gcprError(HttpStatus.NOT_FOUND, "Outcome record not found");
    if (outcome.assessorId !== sp.id) throw new gcprError(HttpStatus.FORBIDDEN, "Only the assessor can update this record");

    const updateData = {};
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.assessmentToolUsed !== undefined) updateData.assessmentToolUsed = data.assessmentToolUsed;

    return prisma.motorFunctionOutcome.update({ where: { id: outcomeId }, data: updateData });
  }

  static async deleteOutcome(user, outcomeId) {
    const sp = await OutcomesService.requireServiceProvider(user.id);
    const outcome = await prisma.motorFunctionOutcome.findUnique({ where: { id: outcomeId } });
    if (!outcome) throw new gcprError(HttpStatus.NOT_FOUND, "Outcome record not found");
    if (outcome.assessorId !== sp.id) throw new gcprError(HttpStatus.FORBIDDEN, "Only the assessor can delete this record");

    await prisma.motorFunctionOutcome.delete({ where: { id: outcomeId } });
  }
}

export default OutcomesService;
