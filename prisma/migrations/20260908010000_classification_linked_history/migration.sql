ALTER TABLE "FunctionalClassification" ADD COLUMN "assessmentId" TEXT,
ADD COLUMN "supersededById" TEXT;

ALTER TABLE "ClinicalAssessment" ADD COLUMN "functionalClassificationId" TEXT;

CREATE INDEX "FunctionalClassification_assessmentId_idx" ON "FunctionalClassification"("assessmentId");
CREATE INDEX "ClinicalAssessment_functionalClassificationId_idx" ON "ClinicalAssessment"("functionalClassificationId");

ALTER TABLE "FunctionalClassification" ADD CONSTRAINT "FunctionalClassification_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "ClinicalAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FunctionalClassification" ADD CONSTRAINT "FunctionalClassification_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "FunctionalClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClinicalAssessment" ADD CONSTRAINT "ClinicalAssessment_functionalClassificationId_fkey" FOREIGN KEY ("functionalClassificationId") REFERENCES "FunctionalClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
