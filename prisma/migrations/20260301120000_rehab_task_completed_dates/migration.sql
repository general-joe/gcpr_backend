-- Replace step-based completion with date-based completion tracking
ALTER TABLE "RehabTask"
DROP COLUMN "completedStepIndexes",
ADD COLUMN "completedDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
