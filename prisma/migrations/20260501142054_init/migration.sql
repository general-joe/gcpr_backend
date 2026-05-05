-- CreateEnum
CREATE TYPE "TelehealthRoomStatus" AS ENUM ('scheduled', 'live', 'completed', 'canceled');

-- CreateEnum
CREATE TYPE "TelehealthParticipantStatus" AS ENUM ('invited', 'accepted', 'joined', 'left', 'declined', 'kicked', 'failed');

-- CreateEnum
CREATE TYPE "TelehealthParticipantRole" AS ENUM ('provider', 'caregiver', 'patient', 'observer', 'interpreter', 'system');

-- CreateEnum
CREATE TYPE "TelehealthVisibility" AS ENUM ('private', 'organization', 'public');

-- CreateEnum
CREATE TYPE "TelehealthMessageType" AS ENUM ('text', 'attachment', 'system');

-- CreateEnum
CREATE TYPE "TelehealthRecordingState" AS ENUM ('processing', 'available', 'archived', 'deleted');

-- CreateEnum
CREATE TYPE "TelehealthWebhookStatus" AS ENUM ('pending', 'processing', 'processed', 'failed');

-- CreateEnum
CREATE TYPE "AssignmentScopeType" AS ENUM ('GLOBAL', 'ORGANIZATION', 'SERVICE_PROVIDER', 'COMMUNITY');

-- CreateEnum
CREATE TYPE "GameSource" AS ENUM ('UPLOADED', 'YOUTUBE', 'EXTERNAL');

-- AlterTable
ALTER TABLE "CommunityAnnouncement" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "CommunityMessage" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PushNotificationToken" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "directMessage" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "pdfResource" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "TelehealthIntegration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "clientId" TEXT,
    "clientSecretEncrypted" BYTEA,
    "apiKeyEncrypted" BYTEA,
    "webhookSecretEncrypted" BYTEA,
    "config" JSONB NOT NULL DEFAULT '{}',
    "defaultRegion" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ownerProviderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelehealthIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelehealthOAuthToken" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "tokenType" TEXT,
    "tokenEncrypted" BYTEA NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "refreshTokenEncrypted" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelehealthOAuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelehealthRoom" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "creatorUserId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "status" "TelehealthRoomStatus" NOT NULL DEFAULT 'scheduled',
    "visibility" "TelehealthVisibility" NOT NULL DEFAULT 'private',
    "maxParticipants" INTEGER NOT NULL DEFAULT 50,
    "providerIntegrationId" TEXT,
    "externalMeetingId" TEXT,
    "joinUrl" TEXT,
    "joinUrlExpiresAt" TIMESTAMP(3),
    "providerPayload" JSONB NOT NULL DEFAULT '{}',
    "isRecordingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "providedByProviderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceledAt" TIMESTAMP(3),
    "canceledBy" TEXT,

    CONSTRAINT "TelehealthRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelehealthParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT,
    "guestEmail" TEXT,
    "role" "TelehealthParticipantRole" NOT NULL DEFAULT 'observer',
    "status" "TelehealthParticipantStatus" NOT NULL DEFAULT 'invited',
    "externalParticipantId" TEXT,
    "joinTokenHash" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "deviceInfo" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelehealthParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelehealthAccessToken" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "createdBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "singleUse" BOOLEAN NOT NULL DEFAULT true,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "TelehealthAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelehealthInvitation" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "inviterUserId" TEXT NOT NULL,
    "inviteeUserId" TEXT,
    "inviteeEmail" TEXT,
    "inviteePhone" TEXT,
    "inviteTokenHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'sent',
    "deliveredVia" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelehealthInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelehealthMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderUserId" TEXT,
    "senderRole" "TelehealthParticipantRole",
    "messageType" "TelehealthMessageType" NOT NULL DEFAULT 'text',
    "content" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "sequence" SERIAL NOT NULL,
    "visibleTo" JSONB NOT NULL DEFAULT 'null',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelehealthMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelehealthRecording" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "providerRecordingId" TEXT,
    "s3Bucket" TEXT,
    "s3Key" TEXT,
    "storageClass" TEXT,
    "encryptionKeyId" TEXT,
    "sizeBytes" BIGINT,
    "durationSeconds" INTEGER,
    "state" "TelehealthRecordingState" NOT NULL DEFAULT 'processing',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availableAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "serviceProviderId" TEXT,

    CONSTRAINT "TelehealthRecording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelehealthTranscript" (
    "id" TEXT NOT NULL,
    "recordingId" TEXT,
    "roomId" TEXT,
    "providerTranscriptId" TEXT,
    "language" TEXT,
    "fullText" TEXT,
    "segments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelehealthTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelehealthWebhookEvent" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT,
    "providerEventId" TEXT,
    "eventType" TEXT,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "status" "TelehealthWebhookStatus" NOT NULL DEFAULT 'pending',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TelehealthWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelehealthAuditLog" (
    "id" TEXT NOT NULL,
    "roomId" TEXT,
    "userId" TEXT,
    "actionType" TEXT NOT NULL,
    "actionDetails" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceProviderId" TEXT,

    CONSTRAINT "TelehealthAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelehealthIdempotencyKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "TelehealthIdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelehealthRoleTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "TelehealthParticipantRole" NOT NULL,
    "defaultPermissions" JSONB NOT NULL DEFAULT '{}',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelehealthRoleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppRole" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "scopeType" "AssignmentScopeType" NOT NULL DEFAULT 'GLOBAL',
    "scopeId" TEXT,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,
    "scopeType" "AssignmentScopeType" NOT NULL DEFAULT 'GLOBAL',
    "scopeId" TEXT,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "source" "GameSource" NOT NULL DEFAULT 'UPLOADED',
    "externalProvider" TEXT,
    "externalId" TEXT,
    "files" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnail" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "uploaderUserId" TEXT NOT NULL,
    "uploaderProviderId" TEXT,
    "allowedRoleSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "GameResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRolePermission" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TelehealthIntegration_organizationId_providerName_idx" ON "TelehealthIntegration"("organizationId", "providerName");

-- CreateIndex
CREATE UNIQUE INDEX "TelehealthIntegration_organizationId_providerName_key" ON "TelehealthIntegration"("organizationId", "providerName");

-- CreateIndex
CREATE INDEX "TelehealthOAuthToken_integrationId_idx" ON "TelehealthOAuthToken"("integrationId");

-- CreateIndex
CREATE INDEX "TelehealthRoom_organizationId_status_scheduledStart_idx" ON "TelehealthRoom"("organizationId", "status", "scheduledStart");

-- CreateIndex
CREATE INDEX "TelehealthRoom_externalMeetingId_idx" ON "TelehealthRoom"("externalMeetingId");

-- CreateIndex
CREATE INDEX "TelehealthRoom_creatorUserId_idx" ON "TelehealthRoom"("creatorUserId");

-- CreateIndex
CREATE INDEX "TelehealthParticipant_roomId_idx" ON "TelehealthParticipant"("roomId");

-- CreateIndex
CREATE INDEX "TelehealthParticipant_userId_idx" ON "TelehealthParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TelehealthParticipant_roomId_userId_key" ON "TelehealthParticipant"("roomId", "userId");

-- CreateIndex
CREATE INDEX "TelehealthAccessToken_roomId_idx" ON "TelehealthAccessToken"("roomId");

-- CreateIndex
CREATE INDEX "TelehealthAccessToken_tokenHash_idx" ON "TelehealthAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "TelehealthInvitation_roomId_idx" ON "TelehealthInvitation"("roomId");

-- CreateIndex
CREATE INDEX "TelehealthInvitation_inviteeEmail_idx" ON "TelehealthInvitation"("inviteeEmail");

-- CreateIndex
CREATE INDEX "TelehealthMessage_roomId_createdAt_idx" ON "TelehealthMessage"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "TelehealthMessage_sequence_idx" ON "TelehealthMessage"("sequence");

-- CreateIndex
CREATE INDEX "TelehealthRecording_roomId_idx" ON "TelehealthRecording"("roomId");

-- CreateIndex
CREATE INDEX "TelehealthRecording_providerRecordingId_idx" ON "TelehealthRecording"("providerRecordingId");

-- CreateIndex
CREATE INDEX "TelehealthTranscript_roomId_idx" ON "TelehealthTranscript"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "TelehealthWebhookEvent_integrationId_providerEventId_key" ON "TelehealthWebhookEvent"("integrationId", "providerEventId");

-- CreateIndex
CREATE INDEX "TelehealthAuditLog_roomId_idx" ON "TelehealthAuditLog"("roomId");

-- CreateIndex
CREATE INDEX "TelehealthAuditLog_userId_idx" ON "TelehealthAuditLog"("userId");

-- CreateIndex
CREATE INDEX "TelehealthAuditLog_createdAt_idx" ON "TelehealthAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TelehealthIdempotencyKey_key_scope_key" ON "TelehealthIdempotencyKey"("key", "scope");

-- CreateIndex
CREATE INDEX "TelehealthRoleTemplate_organizationId_idx" ON "TelehealthRoleTemplate"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AppRole_slug_key" ON "AppRole"("slug");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_scopeType_scopeId_key" ON "UserRole"("userId", "roleId", "scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");

-- CreateIndex
CREATE INDEX "UserPermission_permissionId_idx" ON "UserPermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_scopeType_scopeId_key" ON "UserPermission"("userId", "permissionId", "scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "GameResource_externalProvider_externalId_idx" ON "GameResource"("externalProvider", "externalId");

-- CreateIndex
CREATE INDEX "GameResource_uploaderUserId_idx" ON "GameResource"("uploaderUserId");

-- CreateIndex
CREATE INDEX "GameResource_uploaderProviderId_idx" ON "GameResource"("uploaderProviderId");

-- CreateIndex
CREATE INDEX "GameRolePermission_roleId_idx" ON "GameRolePermission"("roleId");

-- CreateIndex
CREATE INDEX "GameRolePermission_permissionId_idx" ON "GameRolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "GameRolePermission_gameId_roleId_permissionId_key" ON "GameRolePermission"("gameId", "roleId", "permissionId");

-- AddForeignKey
ALTER TABLE "TelehealthIntegration" ADD CONSTRAINT "TelehealthIntegration_ownerProviderId_fkey" FOREIGN KEY ("ownerProviderId") REFERENCES "serviceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthOAuthToken" ADD CONSTRAINT "TelehealthOAuthToken_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "TelehealthIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthRoom" ADD CONSTRAINT "TelehealthRoom_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthRoom" ADD CONSTRAINT "TelehealthRoom_providerIntegrationId_fkey" FOREIGN KEY ("providerIntegrationId") REFERENCES "TelehealthIntegration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthRoom" ADD CONSTRAINT "TelehealthRoom_providedByProviderId_fkey" FOREIGN KEY ("providedByProviderId") REFERENCES "serviceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthParticipant" ADD CONSTRAINT "TelehealthParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "TelehealthRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthParticipant" ADD CONSTRAINT "TelehealthParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthAccessToken" ADD CONSTRAINT "TelehealthAccessToken_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "TelehealthRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthAccessToken" ADD CONSTRAINT "TelehealthAccessToken_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthInvitation" ADD CONSTRAINT "TelehealthInvitation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "TelehealthRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthInvitation" ADD CONSTRAINT "TelehealthInvitation_inviterUserId_fkey" FOREIGN KEY ("inviterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthInvitation" ADD CONSTRAINT "TelehealthInvitation_inviteeUserId_fkey" FOREIGN KEY ("inviteeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthMessage" ADD CONSTRAINT "TelehealthMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "TelehealthRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthMessage" ADD CONSTRAINT "TelehealthMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthRecording" ADD CONSTRAINT "TelehealthRecording_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "TelehealthRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthRecording" ADD CONSTRAINT "TelehealthRecording_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "serviceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthTranscript" ADD CONSTRAINT "TelehealthTranscript_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "TelehealthRecording"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthTranscript" ADD CONSTRAINT "TelehealthTranscript_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "TelehealthRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthWebhookEvent" ADD CONSTRAINT "TelehealthWebhookEvent_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "TelehealthIntegration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthAuditLog" ADD CONSTRAINT "TelehealthAuditLog_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "TelehealthRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthAuditLog" ADD CONSTRAINT "TelehealthAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthAuditLog" ADD CONSTRAINT "TelehealthAuditLog_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "serviceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AppRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AppRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameResource" ADD CONSTRAINT "GameResource_uploaderUserId_fkey" FOREIGN KEY ("uploaderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameResource" ADD CONSTRAINT "GameResource_uploaderProviderId_fkey" FOREIGN KEY ("uploaderProviderId") REFERENCES "serviceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRolePermission" ADD CONSTRAINT "GameRolePermission_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRolePermission" ADD CONSTRAINT "GameRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AppRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRolePermission" ADD CONSTRAINT "GameRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
