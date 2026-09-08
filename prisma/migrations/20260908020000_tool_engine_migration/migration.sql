-- Group 5: configurable assessment-tool engine. New definition tables;
-- drop the dead parallel AssessmentTool/AssessmentToolProfession tables
-- (nothing ever read them; runtime used hardcoded configs).

CREATE TYPE "ToolFieldType" AS ENUM ('SINGLE_CHOICE', 'MULTI_CHOICE', 'SCALE_1_5', 'NUMBER', 'TEXT', 'DATE', 'BOOLEAN', 'FILE_UPLOAD');
CREATE TYPE "ToolScoringStrategy" AS ENUM ('SUM', 'WEIGHTED_SUM', 'RUBRIC', 'CUSTOM_FN_REF');
CREATE TYPE "ToolDefinitionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "assessmentToolDefinition" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "ToolDefinitionStatus" NOT NULL DEFAULT 'DRAFT',
  "applicableScales" TEXT[] NOT NULL DEFAULT '{}',
  "allowedProfessions" TEXT[] NOT NULL DEFAULT '{}',
  "scoringStrategy" "ToolScoringStrategy" NOT NULL DEFAULT 'CUSTOM_FN_REF',
  "customFnRef" TEXT,
  "currentVersion" INTEGER NOT NULL DEFAULT 0,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assessmentToolDefinition_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "assessmentToolDefinition_code_key" ON "assessmentToolDefinition"("code");

CREATE TABLE "assessmentToolSection" (
  "id" TEXT NOT NULL,
  "toolId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "code" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assessmentToolSection_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "assessmentToolSection_toolId_order_idx" ON "assessmentToolSection"("toolId", "order");

CREATE TABLE "assessmentToolField" (
  "id" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "fieldKey" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "helpText" TEXT,
  "fieldType" "ToolFieldType" NOT NULL,
  "options" JSONB,
  "validation" JSONB,
  "scoringWeight" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assessmentToolField_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "assessmentToolField_sectionId_order_idx" ON "assessmentToolField"("sectionId", "order");

CREATE TABLE "assessmentToolVersion" (
  "id" TEXT NOT NULL,
  "toolId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "ToolDefinitionStatus" NOT NULL DEFAULT 'DRAFT',
  "scoringStrategy" "ToolScoringStrategy" NOT NULL,
  "customFnRef" TEXT,
  "allowedProfessions" TEXT[] NOT NULL DEFAULT '{}',
  "applicableScales" TEXT[] NOT NULL DEFAULT '{}',
  "snapshot" JSONB NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assessmentToolVersion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "assessmentToolVersion_toolId_version_key" ON "assessmentToolVersion"("toolId", "version");

ALTER TABLE "assessmentToolSection" ADD CONSTRAINT "assessmentToolSection_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "assessmentToolDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assessmentToolField" ADD CONSTRAINT "assessmentToolField_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "assessmentToolSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assessmentToolVersion" ADD CONSTRAINT "assessmentToolVersion_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "assessmentToolDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE "AssessmentToolProfession";
DROP TABLE "AssessmentTool";
