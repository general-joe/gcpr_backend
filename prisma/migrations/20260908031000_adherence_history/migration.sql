-- Group 6: append-only adherence history so conflicting writes leave a trace.
CREATE TABLE "taskAdherenceLogHistory" (
  "id" TEXT NOT NULL,
  "logId" TEXT,
  "taskId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "logDate" TIMESTAMP(3) NOT NULL,
  "oldStatus" "AdherenceStatus",
  "newStatus" "AdherenceStatus" NOT NULL,
  "changedById" TEXT,
  "changeSource" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "taskAdherenceLogHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "taskAdherenceLogHistory_taskId_logDate_idx" ON "taskAdherenceLogHistory"("taskId", "logDate");
CREATE INDEX "taskAdherenceLogHistory_patientId_idx" ON "taskAdherenceLogHistory"("patientId");
