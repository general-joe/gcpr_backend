/*
  Warnings:

  - You are about to drop the column `address` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `digitalAddress` on the `User` table. All the data in the column will be lost.
  - The `typeOfSchool` column on the `cpPatient` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "schoolType" AS ENUM ('PUBLIC', 'PRIVATE', 'SPECIAL_NEEDS');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'COMPLETED', 'REVIEWED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RehabTaskStatus" AS ENUM ('PENDING', 'ASSIGNED', 'COMPLETED');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "address",
DROP COLUMN "dateOfBirth",
DROP COLUMN "digitalAddress";

-- AlterTable
ALTER TABLE "cpPatient" DROP COLUMN "typeOfSchool",
ADD COLUMN     "typeOfSchool" "schoolType";

-- CreateTable
CREATE TABLE "FunctionalClassification" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "classifier" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL,
    "assessorId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FunctionalClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalAssessment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "toolCode" TEXT NOT NULL,
    "toolVersion" TEXT NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "assessedAt" TIMESTAMP(3),
    "responses" JSONB NOT NULL,
    "referralId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalAssessmentReport" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "summary" TEXT,
    "scores" JSONB NOT NULL,
    "interpretation" TEXT,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalAssessmentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalReferral" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "fromProviderId" TEXT NOT NULL,
    "toProfession" "Profession" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RehabTask" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "instructionSteps" JSONB,
    "frequencyPerDay" INTEGER,
    "frequencyNote" TEXT,
    "durationDays" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "video" JSONB,
    "status" "RehabTaskStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "referralId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RehabTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalAssessment_referralId_key" ON "ClinicalAssessment"("referralId");

-- AddForeignKey
ALTER TABLE "FunctionalClassification" ADD CONSTRAINT "FunctionalClassification_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "cpPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionalClassification" ADD CONSTRAINT "FunctionalClassification_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "serviceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAssessment" ADD CONSTRAINT "ClinicalAssessment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "cpPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAssessment" ADD CONSTRAINT "ClinicalAssessment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "serviceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAssessment" ADD CONSTRAINT "ClinicalAssessment_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "ClinicalReferral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAssessmentReport" ADD CONSTRAINT "ClinicalAssessmentReport_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "ClinicalAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalReferral" ADD CONSTRAINT "ClinicalReferral_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "cpPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalReferral" ADD CONSTRAINT "ClinicalReferral_fromProviderId_fkey" FOREIGN KEY ("fromProviderId") REFERENCES "serviceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehabTask" ADD CONSTRAINT "RehabTask_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "cpPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehabTask" ADD CONSTRAINT "RehabTask_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "serviceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehabTask" ADD CONSTRAINT "RehabTask_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "ClinicalReferral"("id") ON DELETE SET NULL ON UPDATE CASCADE;
