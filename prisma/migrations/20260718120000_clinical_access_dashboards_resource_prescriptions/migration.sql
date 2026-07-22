-- Appointment-to-assessment traceability
ALTER TABLE "ClinicalAssessment"
ADD COLUMN IF NOT EXISTS "appointmentId" TEXT;

ALTER TABLE "ClinicalAssessment"
ADD CONSTRAINT "ClinicalAssessment_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "ClinicalAssessment_appointmentId_idx"
ON "ClinicalAssessment"("appointmentId");

-- Personalized provider resource prescriptions for a patient/caregiver.
CREATE TABLE IF NOT EXISTS "resourcePrescription" (
  "id" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "providerId" TEXT,
  "prescribedById" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "resourcePrescription_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "resourcePrescription"
ADD CONSTRAINT "resourcePrescription_resourceId_fkey"
FOREIGN KEY ("resourceId") REFERENCES "resource"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resourcePrescription"
ADD CONSTRAINT "resourcePrescription_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "cpPatient"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resourcePrescription"
ADD CONSTRAINT "resourcePrescription_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "serviceProvider"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "resourcePrescription"
ADD CONSTRAINT "resourcePrescription_prescribedById_fkey"
FOREIGN KEY ("prescribedById") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "resourcePrescription_resourceId_idx"
ON "resourcePrescription"("resourceId");

CREATE INDEX IF NOT EXISTS "resourcePrescription_patientId_idx"
ON "resourcePrescription"("patientId");

CREATE INDEX IF NOT EXISTS "resourcePrescription_providerId_idx"
ON "resourcePrescription"("providerId");

CREATE INDEX IF NOT EXISTS "resourcePrescription_prescribedById_idx"
ON "resourcePrescription"("prescribedById");
