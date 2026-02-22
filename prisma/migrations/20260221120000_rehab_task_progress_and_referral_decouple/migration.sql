-- Add explicit task progress tracking for rehab tasks
ALTER TABLE "RehabTask"
ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0;
