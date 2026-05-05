import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";

// ─── Period helpers ───────────────────────────────────────────────────────────

function getPeriodRange(date, period) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  let start, end;

  switch (period) {
    case "DAILY":
      start = new Date(d);
      end = new Date(d);
      end.setHours(23, 59, 59, 999);
      break;

    case "WEEKLY": {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      start = new Date(new Date(d).setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }

    case "MONTHLY":
      start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case "QUARTERLY": {
      const qStart = Math.floor(d.getMonth() / 3) * 3;
      start = new Date(d.getFullYear(), qStart, 1, 0, 0, 0, 0);
      end = new Date(d.getFullYear(), qStart + 3, 0, 23, 59, 59, 999);
      break;
    }

    case "YEARLY":
      start = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    default:
      start = new Date(d);
      end = new Date(d);
      end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

// ─── MetricsService ──────────────────────────────────────────────────────────

class MetricsService {
  // ── Helpers ────────────────────────────────────────────────────────────────

  static async requireServiceProvider(userId) {
    const sp = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (!sp) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Service provider not found");
    }
    return sp;
  }

  // ── Provider metrics ───────────────────────────────────────────────────────

  static async getProviderMetrics(userId, period = "DAILY", date) {
    const sp = await MetricsService.requireServiceProvider(userId);
    const snapshotDate = date ? new Date(date) : new Date();
    snapshotDate.setHours(0, 0, 0, 0);

    // Try stored snapshot first
    const snapshot = await prisma.providerMetricsSnapshot.findUnique({
      where: {
        providerId_snapshotDate_period: {
          providerId: sp.id,
          snapshotDate,
          period,
        },
      },
    });

    if (snapshot) {
      return { source: "snapshot", snapshot };
    }

    // Fall back to on-demand computation
    return {
      source: "computed",
      snapshot: await MetricsService.computeProviderSnapshot(
        sp.id,
        snapshotDate,
        period
      ),
    };
  }

  static async computeProviderSnapshot(providerId, date, period = "DAILY") {
    const { start, end } = getPeriodRange(date, period);
    const snapshotDate = new Date(date);
    snapshotDate.setHours(0, 0, 0, 0);

    const [
      patientIdsAll,
      adherenceLogs,
      outcomes,
      appointments,
      assessments,
      referralsMade,
      referralsReceived,
      activities,
    ] = await Promise.all([
      // Distinct patients seen via any channel in period
      prisma.rehabTask
        .findMany({
          where: {
            providerId,
            updatedAt: { gte: start, lte: end },
          },
          select: { patientId: true },
          distinct: ["patientId"],
        })
        .then((rows) => rows.map((r) => r.patientId)),

      // Adherence logs
      prisma.taskAdherenceLog.findMany({
        where: { providerId, logDate: { gte: start, lte: end } },
        select: { patientId: true, status: true },
      }),

      // Motor function outcomes
      prisma.motorFunctionOutcome.findMany({
        where: { assessorId: providerId, reviewDate: { gte: start, lte: end } },
        select: { outcomeDirection: true },
      }),

      // Appointments
      prisma.appointment.findMany({
        where: { providerId, appointmentDate: { gte: start, lte: end } },
        select: { status: true },
      }),

      // Assessments
      prisma.clinicalAssessment.count({
        where: {
          providerId,
          assessedAt: { gte: start, lte: end },
          status: "COMPLETED",
        },
      }),

      // Referrals made
      prisma.clinicalReferral.count({
        where: {
          fromProviderId: providerId,
          createdAt: { gte: start, lte: end },
        },
      }),

      // Referrals received
      prisma.clinicalReferral.count({
        where: {
          toProviderId: providerId,
          createdAt: { gte: start, lte: end },
        },
      }),

      // Activity participation
      prisma.activityParticipationLog.findMany({
        where: { providerId, participatedOn: { gte: start, lte: end } },
        select: { patientId: true, activityCategory: true },
      }),
    ]);

    // Compute adherence stats
    const patientAdherenceMap = {};
    for (const log of adherenceLogs) {
      if (!patientAdherenceMap[log.patientId]) {
        patientAdherenceMap[log.patientId] = { total: 0, completed: 0 };
      }
      patientAdherenceMap[log.patientId].total++;
      if (log.status === "COMPLETED") {
        patientAdherenceMap[log.patientId].completed++;
      }
    }

    const THRESHOLD = 80;
    let adheringCount = 0;
    let nonAdheringCount = 0;
    let totalAdherenceRate = 0;
    const patientEntries = Object.values(patientAdherenceMap);

    for (const entry of patientEntries) {
      const rate = entry.total > 0 ? (entry.completed / entry.total) * 100 : 0;
      totalAdherenceRate += rate;
      if (rate >= THRESHOLD) adheringCount++;
      else nonAdheringCount++;
    }

    const avgAdherenceRate =
      patientEntries.length > 0
        ? parseFloat((totalAdherenceRate / patientEntries.length).toFixed(2))
        : 0;

    // Outcome counts
    const improved = outcomes.filter(
      (o) => o.outcomeDirection === "IMPROVED"
    ).length;
    const stable = outcomes.filter(
      (o) => o.outcomeDirection === "STABLE"
    ).length;
    const regressed = outcomes.filter(
      (o) => o.outcomeDirection === "REGRESSED"
    ).length;

    // Appointment stats
    const apptScheduled = appointments.length;
    const apptCompleted = appointments.filter(
      (a) => a.status === "COMPLETED"
    ).length;
    const apptDeclined = appointments.filter(
      (a) => a.status === "DECLINED"
    ).length;

    // Unique activity categories
    const uniqueCategories = new Set(
      activities.map((a) => a.activityCategory).filter(Boolean)
    );

    // Distinct activity patients
    const activityPatients = new Set(activities.map((a) => a.patientId));

    const snapshotData = {
      providerId,
      snapshotDate,
      period,
      totalChildrenAttended: patientIdsAll.length,
      totalActivitiesAssigned: 0, // populated via cron
      totalActivitiesCompleted: activities.length,
      uniqueActivitiesTypes: uniqueCategories.size,
      totalAdheringPatients: adheringCount,
      totalNonAdheringPatients: nonAdheringCount,
      adherenceThresholdPct: THRESHOLD,
      averageAdherenceRate: avgAdherenceRate,
      totalImprovedOutcomes: improved,
      totalStableOutcomes: stable,
      totalRegressedOutcomes: regressed,
      appointmentsScheduled: apptScheduled,
      appointmentsCompleted: apptCompleted,
      appointmentsDeclined: apptDeclined,
      assessmentsCompleted: assessments,
      referralsMade,
      referralsReceived,
    };

    // Upsert the snapshot
    const saved = await prisma.providerMetricsSnapshot.upsert({
      where: {
        providerId_snapshotDate_period: { providerId, snapshotDate, period },
      },
      create: snapshotData,
      update: {
        ...snapshotData,
        computedAt: new Date(),
      },
    });

    return saved;
  }

  // ── Patient metrics ─────────────────────────────────────────────────────────

  static async getPatientMetrics(requestUserId, patientId, period = "WEEKLY", date) {
    // Service providers and caregivers can access patient metrics
    const snapshotDate = date ? new Date(date) : new Date();
    snapshotDate.setHours(0, 0, 0, 0);

    const snapshot = await prisma.patientMetricsSnapshot.findUnique({
      where: {
        patientId_snapshotDate_period: { patientId, snapshotDate, period },
      },
    });

    if (snapshot) return { source: "snapshot", snapshot };

    return {
      source: "computed",
      snapshot: await MetricsService.computePatientSnapshot(
        patientId,
        snapshotDate,
        period
      ),
    };
  }

  static async computePatientSnapshot(patientId, date, period = "WEEKLY") {
    const { start, end } = getPeriodRange(date, period);
    const snapshotDate = new Date(date);
    snapshotDate.setHours(0, 0, 0, 0);

    const [tasks, adherenceLogs, appointments, assessments, activities, latestFC] =
      await Promise.all([
        prisma.rehabTask.findMany({
          where: { patientId },
          select: { id: true, status: true, durationDays: true, completedDates: true },
        }),
        prisma.taskAdherenceLog.findMany({
          where: { patientId, logDate: { gte: start, lte: end } },
          select: { status: true },
        }),
        prisma.appointment.count({
          where: {
            patientId,
            appointmentDate: { gte: start, lte: end },
            status: "COMPLETED",
          },
        }),
        prisma.clinicalAssessment.count({
          where: {
            patientId,
            assessedAt: { gte: start, lte: end },
            status: "COMPLETED",
          },
        }),
        prisma.activityParticipationLog.count({
          where: { patientId, participatedOn: { gte: start, lte: end } },
        }),
        prisma.functionalClassification.findFirst({
          where: { patientId, classifier: "GMFCS" },
          orderBy: { assessedAt: "desc" },
        }),
      ]);

    const completedLogs = adherenceLogs.filter(
      (l) => l.status === "COMPLETED"
    ).length;
    const missedLogs = adherenceLogs.filter(
      (l) => l.status === "MISSED"
    ).length;
    const adherenceRate =
      adherenceLogs.length > 0
        ? parseFloat(
            ((completedLogs / adherenceLogs.length) * 100).toFixed(2)
          )
        : 0;

    const tasksAssigned = tasks.filter((t) =>
      ["ASSIGNED", "COMPLETED"].includes(t.status)
    ).length;
    const tasksCompleted = tasks.filter((t) => t.status === "COMPLETED").length;

    const snapshotData = {
      patientId,
      snapshotDate,
      period,
      tasksAssigned,
      tasksCompleted,
      tasksMissed: missedLogs,
      adherenceRate,
      currentGmfcsLevel: latestFC?.level ?? null,
      appointmentsAttended: appointments,
      assessmentsCompleted: assessments,
      activitiesParticipated: activities,
    };

    const saved = await prisma.patientMetricsSnapshot.upsert({
      where: {
        patientId_snapshotDate_period: { patientId, snapshotDate, period },
      },
      create: snapshotData,
      update: { ...snapshotData, computedAt: new Date() },
    });

    return saved;
  }

  // ── System metrics ──────────────────────────────────────────────────────────

  static async getSystemMetrics(period = "DAILY", date) {
    const snapshotDate = date ? new Date(date) : new Date();
    snapshotDate.setHours(0, 0, 0, 0);

    const snapshot = await prisma.systemMetricsSnapshot.findUnique({
      where: { snapshotDate_period: { snapshotDate, period } },
    });

    if (snapshot) return { source: "snapshot", snapshot };

    return {
      source: "computed",
      snapshot: await MetricsService.computeSystemSnapshot(snapshotDate, period),
    };
  }

  static async computeSystemSnapshot(date, period = "DAILY") {
    const { start, end } = getPeriodRange(date, period);
    const snapshotDate = new Date(date);
    snapshotDate.setHours(0, 0, 0, 0);

    const [
      totalEnrolled,
      newEnrolled,
      activeEnrollments,
      activeProfessionals,
      adherenceLogs,
      outcomes,
      assessments,
      referrals,
      appointments,
      activities,
    ] = await Promise.all([
      prisma.cpPatient.count(),
      prisma.patientEnrollmentRecord.count({
        where: { enrolledAt: { gte: start, lte: end } },
      }),
      prisma.patientEnrollmentRecord.count({ where: { status: "ACTIVE" } }),
      prisma.serviceProvider.count({
        where: { verificationStatus: "VERIFIED" },
      }),
      prisma.taskAdherenceLog.findMany({
        where: { logDate: { gte: start, lte: end } },
        select: { patientId: true, status: true },
      }),
      prisma.motorFunctionOutcome.findMany({
        where: { reviewDate: { gte: start, lte: end } },
        select: { outcomeDirection: true },
      }),
      prisma.clinicalAssessment.count({
        where: { assessedAt: { gte: start, lte: end }, status: "COMPLETED" },
      }),
      prisma.clinicalReferral.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      prisma.appointment.findMany({
        where: { appointmentDate: { gte: start, lte: end } },
        select: { status: true },
      }),
      prisma.activityParticipationLog.count({
        where: { participatedOn: { gte: start, lte: end } },
      }),
    ]);

    // Platform adherence
    const patientMap = {};
    for (const log of adherenceLogs) {
      if (!patientMap[log.patientId]) {
        patientMap[log.patientId] = { total: 0, completed: 0 };
      }
      patientMap[log.patientId].total++;
      if (log.status === "COMPLETED") patientMap[log.patientId].completed++;
    }

    let adheringPlatform = 0;
    let nonAdheringPlatform = 0;
    let totalRate = 0;
    const entries = Object.values(patientMap);
    for (const e of entries) {
      const r = e.total > 0 ? (e.completed / e.total) * 100 : 0;
      totalRate += r;
      if (r >= 80) adheringPlatform++;
      else nonAdheringPlatform++;
    }
    const platformAdherenceRate =
      entries.length > 0
        ? parseFloat((totalRate / entries.length).toFixed(2))
        : 0;

    const snapshotData = {
      snapshotDate,
      period,
      totalChildrenEnrolled: totalEnrolled,
      newChildrenEnrolledPeriod: newEnrolled,
      totalActiveEnrollments: activeEnrollments,
      totalInactiveEnrollments: totalEnrolled - activeEnrollments,
      totalActiveProfessionals: activeProfessionals,
      totalChildrenAttendedTo: entries.length,
      totalAdheringPlatform: adheringPlatform,
      totalNonAdheringPlatform: nonAdheringPlatform,
      platformAdherenceRate,
      totalImprovedGrossMotor: outcomes.filter(
        (o) => o.outcomeDirection === "IMPROVED"
      ).length,
      totalStableGrossMotor: outcomes.filter(
        (o) => o.outcomeDirection === "STABLE"
      ).length,
      totalRegressedGrossMotor: outcomes.filter(
        (o) => o.outcomeDirection === "REGRESSED"
      ).length,
      totalActivitiesCompleted: activities,
      totalAssessmentsCompleted: assessments,
      totalReferralsMade: referrals,
      totalAppointments: appointments.length,
      totalCompletedAppointments: appointments.filter(
        (a) => a.status === "COMPLETED"
      ).length,
    };

    const saved = await prisma.systemMetricsSnapshot.upsert({
      where: { snapshotDate_period: { snapshotDate, period } },
      create: snapshotData,
      update: { ...snapshotData, computedAt: new Date() },
    });

    return saved;
  }

  // ── Batch compute (used by cron) ────────────────────────────────────────────

  static async computeAllProviderSnapshots(date, period = "DAILY") {
    const providers = await prisma.serviceProvider.findMany({
      select: { id: true },
    });

    const results = [];
    for (const { id } of providers) {
      try {
        const snap = await MetricsService.computeProviderSnapshot(
          id,
          date,
          period
        );
        results.push({ providerId: id, ok: true });
      } catch (err) {
        WRITE.error("[Metrics] Provider snapshot failed", {
          providerId: id,
          err: err.message,
        });
        results.push({ providerId: id, ok: false, err: err.message });
      }
    }

    return results;
  }

  static async computeAllPatientSnapshots(date, period = "WEEKLY") {
    const patients = await prisma.cpPatient.findMany({
      select: { id: true },
    });

    const results = [];
    for (const { id } of patients) {
      try {
        await MetricsService.computePatientSnapshot(id, date, period);
        results.push({ patientId: id, ok: true });
      } catch (err) {
        WRITE.error("[Metrics] Patient snapshot failed", {
          patientId: id,
          err: err.message,
        });
        results.push({ patientId: id, ok: false, err: err.message });
      }
    }

    return results;
  }
}

export default MetricsService;
