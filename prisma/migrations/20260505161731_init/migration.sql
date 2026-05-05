-- CreateEnum
CREATE TYPE "AdherenceStatus" AS ENUM ('PENDING', 'COMPLETED', 'MISSED', 'EXCUSED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'COMPLETED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "OutcomeDirection" AS ENUM ('IMPROVED', 'STABLE', 'REGRESSED');

-- CreateEnum
CREATE TYPE "MetricPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateTable
CREATE TABLE "TaskAdherenceLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "logDate" TIMESTAMP(3) NOT NULL,
    "status" "AdherenceStatus" NOT NULL DEFAULT 'PENDING',
    "markedById" TEXT,
    "markedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAdherenceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientEnrollmentRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrolledByUserId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "programName" TEXT,
    "unenrolledAt" TIMESTAMP(3),
    "unenrollReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientEnrollmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotorFunctionOutcome" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "baselineLevel" INTEGER NOT NULL,
    "currentLevel" INTEGER NOT NULL,
    "baselineDate" TIMESTAMP(3) NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "outcomeDirection" "OutcomeDirection" NOT NULL,
    "percentageChange" DOUBLE PRECISION,
    "notes" TEXT,
    "assessmentToolUsed" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MotorFunctionOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityParticipationLog" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "taskId" TEXT,
    "activityName" TEXT NOT NULL,
    "activityCategory" TEXT,
    "participatedOn" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "outcome" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityParticipationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderMetricsSnapshot" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "period" "MetricPeriod" NOT NULL DEFAULT 'DAILY',
    "totalChildrenAttended" INTEGER NOT NULL DEFAULT 0,
    "newChildrenAttended" INTEGER NOT NULL DEFAULT 0,
    "returningChildrenAttended" INTEGER NOT NULL DEFAULT 0,
    "totalActivitiesAssigned" INTEGER NOT NULL DEFAULT 0,
    "totalActivitiesCompleted" INTEGER NOT NULL DEFAULT 0,
    "uniqueActivitiesTypes" INTEGER NOT NULL DEFAULT 0,
    "totalAdheringPatients" INTEGER NOT NULL DEFAULT 0,
    "totalNonAdheringPatients" INTEGER NOT NULL DEFAULT 0,
    "adherenceThresholdPct" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "averageAdherenceRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalImprovedOutcomes" INTEGER NOT NULL DEFAULT 0,
    "totalStableOutcomes" INTEGER NOT NULL DEFAULT 0,
    "totalRegressedOutcomes" INTEGER NOT NULL DEFAULT 0,
    "appointmentsScheduled" INTEGER NOT NULL DEFAULT 0,
    "appointmentsCompleted" INTEGER NOT NULL DEFAULT 0,
    "appointmentsDeclined" INTEGER NOT NULL DEFAULT 0,
    "assessmentsCompleted" INTEGER NOT NULL DEFAULT 0,
    "referralsMade" INTEGER NOT NULL DEFAULT 0,
    "referralsReceived" INTEGER NOT NULL DEFAULT 0,
    "telehealthSessionsHosted" INTEGER NOT NULL DEFAULT 0,
    "telehealthMinutesTotal" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderMetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMetricsSnapshot" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "period" "MetricPeriod" NOT NULL DEFAULT 'DAILY',
    "totalChildrenEnrolled" INTEGER NOT NULL DEFAULT 0,
    "newChildrenEnrolledPeriod" INTEGER NOT NULL DEFAULT 0,
    "totalActiveEnrollments" INTEGER NOT NULL DEFAULT 0,
    "totalInactiveEnrollments" INTEGER NOT NULL DEFAULT 0,
    "totalActiveProfessionals" INTEGER NOT NULL DEFAULT 0,
    "totalChildrenAttendedTo" INTEGER NOT NULL DEFAULT 0,
    "totalAdheringPlatform" INTEGER NOT NULL DEFAULT 0,
    "totalNonAdheringPlatform" INTEGER NOT NULL DEFAULT 0,
    "platformAdherenceRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalImprovedGrossMotor" INTEGER NOT NULL DEFAULT 0,
    "totalStableGrossMotor" INTEGER NOT NULL DEFAULT 0,
    "totalRegressedGrossMotor" INTEGER NOT NULL DEFAULT 0,
    "totalActivitiesAssigned" INTEGER NOT NULL DEFAULT 0,
    "totalActivitiesCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalActivityParticipants" INTEGER NOT NULL DEFAULT 0,
    "totalAssessmentsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalReferralsMade" INTEGER NOT NULL DEFAULT 0,
    "totalTelehealthSessions" INTEGER NOT NULL DEFAULT 0,
    "totalTelehealthMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalAppointments" INTEGER NOT NULL DEFAULT 0,
    "totalCompletedAppointments" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemMetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientMetricsSnapshot" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "period" "MetricPeriod" NOT NULL DEFAULT 'WEEKLY',
    "tasksAssigned" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "tasksMissed" INTEGER NOT NULL DEFAULT 0,
    "adherenceRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currentGmfcsLevel" INTEGER,
    "previousGmfcsLevel" INTEGER,
    "outcomeDirection" "OutcomeDirection",
    "appointmentsAttended" INTEGER NOT NULL DEFAULT 0,
    "assessmentsCompleted" INTEGER NOT NULL DEFAULT 0,
    "activitiesParticipated" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientMetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskAdherenceLog_patientId_logDate_idx" ON "TaskAdherenceLog"("patientId", "logDate");

-- CreateIndex
CREATE INDEX "TaskAdherenceLog_providerId_logDate_idx" ON "TaskAdherenceLog"("providerId", "logDate");

-- CreateIndex
CREATE INDEX "TaskAdherenceLog_status_idx" ON "TaskAdherenceLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAdherenceLog_taskId_logDate_key" ON "TaskAdherenceLog"("taskId", "logDate");

-- CreateIndex
CREATE UNIQUE INDEX "PatientEnrollmentRecord_patientId_key" ON "PatientEnrollmentRecord"("patientId");

-- CreateIndex
CREATE INDEX "PatientEnrollmentRecord_status_idx" ON "PatientEnrollmentRecord"("status");

-- CreateIndex
CREATE INDEX "PatientEnrollmentRecord_enrolledAt_idx" ON "PatientEnrollmentRecord"("enrolledAt");

-- CreateIndex
CREATE INDEX "MotorFunctionOutcome_patientId_idx" ON "MotorFunctionOutcome"("patientId");

-- CreateIndex
CREATE INDEX "MotorFunctionOutcome_assessorId_idx" ON "MotorFunctionOutcome"("assessorId");

-- CreateIndex
CREATE INDEX "MotorFunctionOutcome_outcomeDirection_idx" ON "MotorFunctionOutcome"("outcomeDirection");

-- CreateIndex
CREATE INDEX "MotorFunctionOutcome_reviewDate_idx" ON "MotorFunctionOutcome"("reviewDate");

-- CreateIndex
CREATE INDEX "ActivityParticipationLog_patientId_idx" ON "ActivityParticipationLog"("patientId");

-- CreateIndex
CREATE INDEX "ActivityParticipationLog_providerId_idx" ON "ActivityParticipationLog"("providerId");

-- CreateIndex
CREATE INDEX "ActivityParticipationLog_participatedOn_idx" ON "ActivityParticipationLog"("participatedOn");

-- CreateIndex
CREATE INDEX "ActivityParticipationLog_activityCategory_idx" ON "ActivityParticipationLog"("activityCategory");

-- CreateIndex
CREATE INDEX "ProviderMetricsSnapshot_providerId_period_idx" ON "ProviderMetricsSnapshot"("providerId", "period");

-- CreateIndex
CREATE INDEX "ProviderMetricsSnapshot_snapshotDate_idx" ON "ProviderMetricsSnapshot"("snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderMetricsSnapshot_providerId_snapshotDate_period_key" ON "ProviderMetricsSnapshot"("providerId", "snapshotDate", "period");

-- CreateIndex
CREATE INDEX "SystemMetricsSnapshot_snapshotDate_period_idx" ON "SystemMetricsSnapshot"("snapshotDate", "period");

-- CreateIndex
CREATE UNIQUE INDEX "SystemMetricsSnapshot_snapshotDate_period_key" ON "SystemMetricsSnapshot"("snapshotDate", "period");

-- CreateIndex
CREATE INDEX "PatientMetricsSnapshot_patientId_period_idx" ON "PatientMetricsSnapshot"("patientId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "PatientMetricsSnapshot_patientId_snapshotDate_period_key" ON "PatientMetricsSnapshot"("patientId", "snapshotDate", "period");

-- AddForeignKey
ALTER TABLE "TaskAdherenceLog" ADD CONSTRAINT "TaskAdherenceLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "RehabTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAdherenceLog" ADD CONSTRAINT "TaskAdherenceLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "cpPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAdherenceLog" ADD CONSTRAINT "TaskAdherenceLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "serviceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientEnrollmentRecord" ADD CONSTRAINT "PatientEnrollmentRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "cpPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotorFunctionOutcome" ADD CONSTRAINT "MotorFunctionOutcome_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "cpPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotorFunctionOutcome" ADD CONSTRAINT "MotorFunctionOutcome_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "serviceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityParticipationLog" ADD CONSTRAINT "ActivityParticipationLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "cpPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityParticipationLog" ADD CONSTRAINT "ActivityParticipationLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "serviceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityParticipationLog" ADD CONSTRAINT "ActivityParticipationLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "RehabTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderMetricsSnapshot" ADD CONSTRAINT "ProviderMetricsSnapshot_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "serviceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMetricsSnapshot" ADD CONSTRAINT "PatientMetricsSnapshot_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "cpPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
