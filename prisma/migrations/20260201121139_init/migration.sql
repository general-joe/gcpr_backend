-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "Relationship" AS ENUM ('PARENT', 'GUARDIAN', 'SIBLING', 'OTHER');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SERVICE_PROVIDER', 'CAREGIVER');

-- CreateEnum
CREATE TYPE "CaregiverType" AS ENUM ('GROUP', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('BASIC', 'HIGHSCHOOL', 'TERTIARY');

-- CreateEnum
CREATE TYPE "IdType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'ECOWAS_ID');

-- CreateEnum
CREATE TYPE "Profession" AS ENUM ('GENERAL_PAEDIATRICIAN', 'DEVELOPMENTAL_PAEDIATRICIAN', 'PAEDIATRIC_NEUROLOGIST', 'NEURODEVELOPMENTAL_PAEDIATRICIAN', 'REHABILITATION_PAEDIATRICIAN', 'PHYSIOTHERAPIST', 'OCCUPATIONAL_THERAPIST', 'SPEECH_THERAPIST', 'CLINICAL_PSYCHOLOGIST', 'DIETITIAN', 'PHARMACIST');

-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('TERTIARY_TEACHING_HOSPITAL', 'REGIONAL_HOSPITAL', 'SECONDARY_HEALTH_CARE', 'PRIMARY_HEALTHCARE', 'CP_HOME');

-- CreateEnum
CREATE TYPE "ProfessionalBody" AS ENUM ('AHPC', 'MDC', 'PHCG', 'PSCG');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "digitalAddress" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serviceProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseDetails" TEXT[],
    "licenseNumber" TEXT,
    "licenseImage" TEXT,
    "licenseExpiry" TIMESTAMP(3) NOT NULL,
    "licenseIssuedBy" TEXT,
    "licenseIssuedDate" TIMESTAMP(3) NOT NULL,
    "licenseType" TEXT NOT NULL,
    "licenseStatus" "LicenseStatus" NOT NULL DEFAULT 'INACTIVE',
    "profession" "Profession" NOT NULL,
    "facilityType" "FacilityType" NOT NULL,
    "facilityName" TEXT NOT NULL,
    "facilityAddress" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serviceProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareGiver" (
    "id" TEXT NOT NULL,
    "type" "CaregiverType" NOT NULL,
    "userId" TEXT,
    "occupation" TEXT,
    "educationLevel" "EducationLevel",
    "idType" "IdType",
    "idNumber" TEXT,
    "nameOfGroup" TEXT,
    "locationOfGroup" TEXT,
    "groupContact" TEXT,
    "groupDigitalAddress" TEXT,
    "groupEmail" TEXT,
    "ManagerName" TEXT,
    "managerContact" TEXT,
    "verificationDocuments" TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareGiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cpPatient" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "address" TEXT NOT NULL,
    "placeOfBirth" TEXT NOT NULL,
    "birthWeight" DOUBLE PRECISION,
    "numberOfSiblings" INTEGER,
    "caregiverId" TEXT NOT NULL,
    "relationToCaregiver" "Relationship" NOT NULL,
    "householdSize" INTEGER NOT NULL,
    "schoolEnrollmmentStatus" BOOLEAN NOT NULL DEFAULT false,
    "typeOfSchool" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cpPatient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Otp_userId_key" ON "Otp"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "serviceProvider_userId_key" ON "serviceProvider"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CareGiver_userId_key" ON "CareGiver"("userId");

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serviceProvider" ADD CONSTRAINT "serviceProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareGiver" ADD CONSTRAINT "CareGiver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpPatient" ADD CONSTRAINT "cpPatient_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "CareGiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
