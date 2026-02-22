-- Track caregiver step-level completion and caregiver completion timestamp
ALTER TABLE "RehabTask"
ADD COLUMN "completedStepIndexes" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN "caregiverMarkedDoneAt" TIMESTAMP(3);
