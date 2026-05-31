/*
  Warnings:

  - You are about to drop the `pdfResource` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('DOCUMENT', 'VIDEO', 'LINK');

-- DropForeignKey
ALTER TABLE "pdfResource" DROP CONSTRAINT "pdfResource_serviceProviderId_fkey";

-- DropForeignKey
ALTER TABLE "pdfResource" DROP CONSTRAINT "pdfResource_userId_fkey";

-- DropTable
DROP TABLE "pdfResource";

-- CreateTable
CREATE TABLE "resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ResourceType" NOT NULL DEFAULT 'DOCUMENT',
    "resourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceProviderId" TEXT,
    "userId" TEXT,

    CONSTRAINT "resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resource_serviceProviderId_idx" ON "resource"("serviceProviderId");

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "serviceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
