/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CarePlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "CarePlanSignerType" AS ENUM ('PROVIDER', 'REVIEWER', 'CAREGIVER');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('TREATMENT', 'DATA_SHARING', 'RECORDING', 'PHOTO_VIDEO', 'RESEARCH');

-- CreateEnum
CREATE TYPE "ConsentMethod" AS ENUM ('DIGITAL_SIGNATURE', 'SMS', 'PAPER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssessmentStatus" ADD VALUE 'PENDING_REVIEW';
ALTER TYPE "AssessmentStatus" ADD VALUE 'REVIEWED_NEEDS_REVISION';
ALTER TYPE "AssessmentStatus" ADD VALUE 'APPROVED';

-- DropForeignKey
ALTER TABLE "CareGiver" DROP CONSTRAINT "CareGiver_userId_fkey";

-- DropForeignKey
ALTER TABLE "ChatSession" DROP CONSTRAINT "ChatSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "Community" DROP CONSTRAINT "Community_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "CommunityAnnouncement" DROP CONSTRAINT "CommunityAnnouncement_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "CommunityGroupMember" DROP CONSTRAINT "CommunityGroupMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "CommunityInvitation" DROP CONSTRAINT "CommunityInvitation_invitedBy_fkey";

-- DropForeignKey
ALTER TABLE "CommunityMember" DROP CONSTRAINT "CommunityMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "CommunityMessage" DROP CONSTRAINT "CommunityMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentSignature" DROP CONSTRAINT "DocumentSignature_signerId_fkey";

-- DropForeignKey
ALTER TABLE "GameResource" DROP CONSTRAINT "GameResource_uploaderUserId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Otp" DROP CONSTRAINT "Otp_userId_fkey";

-- DropForeignKey
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "PushNotificationToken" DROP CONSTRAINT "PushNotificationToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_reporterId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_targetUserId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_userId_fkey";

-- DropForeignKey
ALTER TABLE "TelehealthAccessToken" DROP CONSTRAINT "TelehealthAccessToken_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "TelehealthAuditLog" DROP CONSTRAINT "TelehealthAuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "TelehealthInvitation" DROP CONSTRAINT "TelehealthInvitation_inviteeUserId_fkey";

-- DropForeignKey
ALTER TABLE "TelehealthInvitation" DROP CONSTRAINT "TelehealthInvitation_inviterUserId_fkey";

-- DropForeignKey
ALTER TABLE "TelehealthMessage" DROP CONSTRAINT "TelehealthMessage_senderUserId_fkey";

-- DropForeignKey
ALTER TABLE "TelehealthParticipant" DROP CONSTRAINT "TelehealthParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "TelehealthRoom" DROP CONSTRAINT "TelehealthRoom_creatorUserId_fkey";

-- DropForeignKey
ALTER TABLE "TicketMessage" DROP CONSTRAINT "TicketMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "UserPermission" DROP CONSTRAINT "UserPermission_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSignature" DROP CONSTRAINT "UserSignature_userId_fkey";

-- DropForeignKey
ALTER TABLE "directMessage" DROP CONSTRAINT "directMessage_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "directMessage" DROP CONSTRAINT "directMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "resource" DROP CONSTRAINT "resource_userId_fkey";

-- DropForeignKey
ALTER TABLE "serviceProvider" DROP CONSTRAINT "serviceProvider_userId_fkey";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "gender" "Gender" NOT NULL,
    "address" TEXT,
    "digitalAddress" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "userType" "UserType" NOT NULL,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carePlan" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "primaryProviderId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3),
    "status" "CarePlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "goals" JSONB NOT NULL,
    "interventions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "carePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlanSignature" (
    "id" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentHash" TEXT,
    "signerType" "CarePlanSignerType" NOT NULL DEFAULT 'PROVIDER',

    CONSTRAINT "CarePlanSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "grantedByUserId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "scope" TEXT,
    "documentId" TEXT,
    "method" "ConsentMethod" NOT NULL DEFAULT 'DIGITAL_SIGNATURE',

    CONSTRAINT "consentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_phoneNumber_key" ON "user"("phoneNumber");

-- CreateIndex
CREATE INDEX "user_id_idx" ON "user"("id");

-- CreateIndex
CREATE INDEX "carePlan_patientId_idx" ON "carePlan"("patientId");

-- CreateIndex
CREATE INDEX "carePlan_assessmentId_idx" ON "carePlan"("assessmentId");

-- CreateIndex
CREATE INDEX "carePlan_primaryProviderId_idx" ON "carePlan"("primaryProviderId");

-- CreateIndex
CREATE INDEX "CarePlanSignature_carePlanId_idx" ON "CarePlanSignature"("carePlanId");

-- CreateIndex
CREATE INDEX "CarePlanSignature_signerId_idx" ON "CarePlanSignature"("signerId");

-- CreateIndex
CREATE INDEX "consentRecord_patientId_idx" ON "consentRecord"("patientId");

-- CreateIndex
CREATE INDEX "consentRecord_grantedByUserId_idx" ON "consentRecord"("grantedByUserId");

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serviceProvider" ADD CONSTRAINT "serviceProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareGiver" ADD CONSTRAINT "CareGiver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGroupMember" ADD CONSTRAINT "CommunityGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMessage" ADD CONSTRAINT "CommunityMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAnnouncement" ADD CONSTRAINT "CommunityAnnouncement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityInvitation" ADD CONSTRAINT "CommunityInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotificationToken" ADD CONSTRAINT "PushNotificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "directMessage" ADD CONSTRAINT "directMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "directMessage" ADD CONSTRAINT "directMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthRoom" ADD CONSTRAINT "TelehealthRoom_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthParticipant" ADD CONSTRAINT "TelehealthParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthAccessToken" ADD CONSTRAINT "TelehealthAccessToken_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthInvitation" ADD CONSTRAINT "TelehealthInvitation_inviteeUserId_fkey" FOREIGN KEY ("inviteeUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthInvitation" ADD CONSTRAINT "TelehealthInvitation_inviterUserId_fkey" FOREIGN KEY ("inviterUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthMessage" ADD CONSTRAINT "TelehealthMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthAuditLog" ADD CONSTRAINT "TelehealthAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameResource" ADD CONSTRAINT "GameResource_uploaderUserId_fkey" FOREIGN KEY ("uploaderUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carePlan" ADD CONSTRAINT "carePlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "cpPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carePlan" ADD CONSTRAINT "carePlan_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "ClinicalAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carePlan" ADD CONSTRAINT "carePlan_primaryProviderId_fkey" FOREIGN KEY ("primaryProviderId") REFERENCES "serviceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanSignature" ADD CONSTRAINT "CarePlanSignature_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "carePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanSignature" ADD CONSTRAINT "CarePlanSignature_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentRecord" ADD CONSTRAINT "consentRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "cpPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentRecord" ADD CONSTRAINT "consentRecord_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSignature" ADD CONSTRAINT "UserSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
