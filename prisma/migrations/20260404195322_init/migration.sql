/*
  Warnings:

  - You are about to drop the column `pdfFiles` on the `pdfResource` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('IN_APP', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('DIRECT_MESSAGE', 'COMMUNITY_MESSAGE', 'COMMUNITY_ANNOUNCEMENT', 'APPOINTMENT_REMINDER', 'TASK_REMINDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'DEACTIVATED', 'DELETED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "pdfResource" DROP COLUMN "pdfFiles",
ADD COLUMN     "pdfFile" TEXT[],
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "data" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "relatedId" TEXT,
    "relatedModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "deviceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushNotificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_category_idx" ON "Notification"("type", "category");

-- CreateIndex
CREATE UNIQUE INDEX "PushNotificationToken_token_key" ON "PushNotificationToken"("token");

-- CreateIndex
CREATE INDEX "PushNotificationToken_userId_idx" ON "PushNotificationToken"("userId");

-- CreateIndex
CREATE INDEX "PushNotificationToken_token_idx" ON "PushNotificationToken"("token");

-- CreateIndex
CREATE INDEX "PushNotificationToken_isActive_idx" ON "PushNotificationToken"("isActive");

-- AddForeignKey
ALTER TABLE "pdfResource" ADD CONSTRAINT "pdfResource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotificationToken" ADD CONSTRAINT "PushNotificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
