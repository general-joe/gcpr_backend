/*
  Warnings:

  - You are about to drop the column `age` on the `cpPatient` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cpPatient" DROP COLUMN "age";

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_providerId_idx" ON "Appointment"("providerId");

-- CreateIndex
CREATE INDEX "ClinicalAssessment_patientId_idx" ON "ClinicalAssessment"("patientId");

-- CreateIndex
CREATE INDEX "ClinicalAssessment_providerId_idx" ON "ClinicalAssessment"("providerId");

-- CreateIndex
CREATE INDEX "ClinicalAssessmentReport_assessmentId_idx" ON "ClinicalAssessmentReport"("assessmentId");

-- CreateIndex
CREATE INDEX "ClinicalReferral_patientId_idx" ON "ClinicalReferral"("patientId");

-- CreateIndex
CREATE INDEX "ClinicalReferral_fromProviderId_idx" ON "ClinicalReferral"("fromProviderId");

-- CreateIndex
CREATE INDEX "FunctionalClassification_patientId_idx" ON "FunctionalClassification"("patientId");

-- CreateIndex
CREATE INDEX "FunctionalClassification_assessorId_idx" ON "FunctionalClassification"("assessorId");

-- CreateIndex
CREATE INDEX "RehabTask_patientId_idx" ON "RehabTask"("patientId");

-- CreateIndex
CREATE INDEX "RehabTask_providerId_idx" ON "RehabTask"("providerId");

-- CreateIndex
CREATE INDEX "RehabTask_referralId_idx" ON "RehabTask"("referralId");

-- CreateIndex
CREATE INDEX "cpPatient_caregiverId_idx" ON "cpPatient"("caregiverId");
