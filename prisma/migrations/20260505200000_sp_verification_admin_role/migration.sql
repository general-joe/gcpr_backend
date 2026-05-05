-- Add ADMIN to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN';

-- Create VerificationStatus enum
DO $$ BEGIN
  CREATE TYPE "VerificationStatus" AS ENUM ('PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create FunctionalClassifierType enum
DO $$ BEGIN
  CREATE TYPE "FunctionalClassifierType" AS ENUM ('GMFCS', 'MACS', 'CFCS', 'EDACS', 'VIKING_SPEECH_SCALE', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add verification fields to serviceProvider
ALTER TABLE "serviceProvider"
  ADD COLUMN IF NOT EXISTS "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  ADD COLUMN IF NOT EXISTS "verificationNote"   TEXT,
  ADD COLUMN IF NOT EXISTS "verifiedAt"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifiedBy"         TEXT;

-- Create index on verificationStatus
CREATE INDEX IF NOT EXISTS "serviceProvider_verificationStatus_idx"
  ON "serviceProvider"("verificationStatus");

-- Migrate FunctionalClassification.classifier from String to FunctionalClassifierType
-- Step 1: Add a temp column with the enum type
ALTER TABLE "FunctionalClassification"
  ADD COLUMN IF NOT EXISTS "classifierEnum" "FunctionalClassifierType";

-- Step 2: Populate it (handle existing text values safely)
UPDATE "FunctionalClassification"
  SET "classifierEnum" = CASE
    WHEN "classifier" IN ('GMFCS','MACS','CFCS','EDACS','VIKING_SPEECH_SCALE','OTHER') THEN "classifier"::"FunctionalClassifierType"
    ELSE 'OTHER'::"FunctionalClassifierType"
  END;

-- Step 3: Drop old column, rename new one
ALTER TABLE "FunctionalClassification" DROP COLUMN IF EXISTS "classifier";
ALTER TABLE "FunctionalClassification" RENAME COLUMN "classifierEnum" TO "classifier";

-- Step 4: Set NOT NULL
ALTER TABLE "FunctionalClassification" ALTER COLUMN "classifier" SET NOT NULL;

-- Add classifier index
CREATE INDEX IF NOT EXISTS "FunctionalClassification_classifier_idx"
  ON "FunctionalClassification"("classifier");
