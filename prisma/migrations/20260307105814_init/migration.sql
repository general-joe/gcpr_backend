/*
  Warnings:

  - You are about to drop the column `reason` on the `Appointment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "reason",
ADD COLUMN     "reasonAudio" TEXT,
ADD COLUMN     "reasontext" TEXT;
