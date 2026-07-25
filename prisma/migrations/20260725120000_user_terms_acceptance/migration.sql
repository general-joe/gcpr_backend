ALTER TABLE "user"
ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "privacyPolicyAcceptedAt" TIMESTAMP(3),
ADD COLUMN "termsVersion" TEXT,
ADD COLUMN "privacyPolicyVersion" TEXT;
