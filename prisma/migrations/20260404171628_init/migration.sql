/*
  Warnings:

  - You are about to drop the column `createdBy` on the `pdfResource` table. All the data in the column will be lost.
  - You are about to drop the column `resourceUrl` on the `pdfResource` table. All the data in the column will be lost.
  - Added the required column `serviceProviderId` to the `pdfResource` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "pdfResource" DROP CONSTRAINT "pdfResource_createdBy_fkey";

-- DropIndex
DROP INDEX "pdfResource_createdBy_idx";

-- AlterTable
ALTER TABLE "pdfResource" DROP COLUMN "createdBy",
DROP COLUMN "resourceUrl",
ADD COLUMN     "pdfFiles" TEXT[],
ADD COLUMN     "serviceProviderId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "pdfResource_serviceProviderId_idx" ON "pdfResource"("serviceProviderId");

-- AddForeignKey
ALTER TABLE "pdfResource" ADD CONSTRAINT "pdfResource_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "serviceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
