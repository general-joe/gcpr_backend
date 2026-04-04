-- CreateEnum
CREATE TYPE "DirectMessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- AlterTable
ALTER TABLE "CommunityMessage" ADD COLUMN     "dislikes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "likes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "pdfResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resourceUrl" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdfResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT,
    "mediaUrl" TEXT,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "status" "DirectMessageStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "directMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pdfResource_createdBy_idx" ON "pdfResource"("createdBy");

-- CreateIndex
CREATE INDEX "directMessage_senderId_idx" ON "directMessage"("senderId");

-- CreateIndex
CREATE INDEX "directMessage_receiverId_idx" ON "directMessage"("receiverId");

-- CreateIndex
CREATE INDEX "directMessage_createdAt_idx" ON "directMessage"("createdAt");

-- CreateIndex
CREATE INDEX "directMessage_senderId_receiverId_idx" ON "directMessage"("senderId", "receiverId");

-- AddForeignKey
ALTER TABLE "pdfResource" ADD CONSTRAINT "pdfResource_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "directMessage" ADD CONSTRAINT "directMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "directMessage" ADD CONSTRAINT "directMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
