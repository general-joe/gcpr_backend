-- CreateEnum
CREATE TYPE "CommunityMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "CommunityMemberStatus" AS ENUM ('ACTIVE', 'PENDING', 'BANNED', 'LEFT');

-- CreateEnum
CREATE TYPE "GroupMemberRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'LOCATION');

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "createdBy" TEXT NOT NULL,
    "inviteCode" TEXT,
    "inviteEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxMembers" INTEGER NOT NULL DEFAULT 1000,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMember" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CommunityMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "CommunityMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityGroup" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "createdBy" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isAnnouncementOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GroupMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMessage" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "mediaUrl" TEXT,
    "metadata" JSONB,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityAnnouncement" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityInvitation" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "invitedUser" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Community_inviteCode_key" ON "Community"("inviteCode");

-- CreateIndex
CREATE INDEX "Community_createdBy_idx" ON "Community"("createdBy");

-- CreateIndex
CREATE INDEX "Community_inviteCode_idx" ON "Community"("inviteCode");

-- CreateIndex
CREATE INDEX "CommunityMember_userId_idx" ON "CommunityMember"("userId");

-- CreateIndex
CREATE INDEX "CommunityMember_communityId_status_idx" ON "CommunityMember"("communityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityMember_communityId_userId_key" ON "CommunityMember"("communityId", "userId");

-- CreateIndex
CREATE INDEX "CommunityGroup_communityId_idx" ON "CommunityGroup"("communityId");

-- CreateIndex
CREATE INDEX "CommunityGroup_createdBy_idx" ON "CommunityGroup"("createdBy");

-- CreateIndex
CREATE INDEX "CommunityGroupMember_userId_idx" ON "CommunityGroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityGroupMember_groupId_userId_key" ON "CommunityGroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "CommunityMessage_groupId_idx" ON "CommunityMessage"("groupId");

-- CreateIndex
CREATE INDEX "CommunityMessage_senderId_idx" ON "CommunityMessage"("senderId");

-- CreateIndex
CREATE INDEX "CommunityMessage_createdAt_idx" ON "CommunityMessage"("createdAt");

-- CreateIndex
CREATE INDEX "CommunityAnnouncement_communityId_idx" ON "CommunityAnnouncement"("communityId");

-- CreateIndex
CREATE INDEX "CommunityAnnouncement_createdBy_idx" ON "CommunityAnnouncement"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityInvitation_code_key" ON "CommunityInvitation"("code");

-- CreateIndex
CREATE INDEX "CommunityInvitation_communityId_idx" ON "CommunityInvitation"("communityId");

-- CreateIndex
CREATE INDEX "CommunityInvitation_code_idx" ON "CommunityInvitation"("code");

-- CreateIndex
CREATE INDEX "CommunityInvitation_invitedBy_idx" ON "CommunityInvitation"("invitedBy");

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGroup" ADD CONSTRAINT "CommunityGroup_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGroupMember" ADD CONSTRAINT "CommunityGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CommunityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGroupMember" ADD CONSTRAINT "CommunityGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMessage" ADD CONSTRAINT "CommunityMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CommunityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMessage" ADD CONSTRAINT "CommunityMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMessage" ADD CONSTRAINT "CommunityMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "CommunityMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAnnouncement" ADD CONSTRAINT "CommunityAnnouncement_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAnnouncement" ADD CONSTRAINT "CommunityAnnouncement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityInvitation" ADD CONSTRAINT "CommunityInvitation_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityInvitation" ADD CONSTRAINT "CommunityInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
