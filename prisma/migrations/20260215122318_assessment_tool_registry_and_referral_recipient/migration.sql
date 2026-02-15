-- CreateTable
CREATE TABLE "AssessmentTool" (
    "id" TEXT NOT NULL,
    "toolCode" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "schema" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentToolProfession" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "profession" "Profession" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentToolProfession_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ClinicalReferral" ADD COLUMN "toProviderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentTool_toolCode_key" ON "AssessmentTool"("toolCode");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentToolProfession_toolId_profession_key" ON "AssessmentToolProfession"("toolId", "profession");

-- CreateIndex
CREATE INDEX "ClinicalReferral_toProviderId_idx" ON "ClinicalReferral"("toProviderId");

-- AddForeignKey
ALTER TABLE "AssessmentToolProfession" ADD CONSTRAINT "AssessmentToolProfession_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "AssessmentTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalReferral" ADD CONSTRAINT "ClinicalReferral_toProviderId_fkey" FOREIGN KEY ("toProviderId") REFERENCES "serviceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
