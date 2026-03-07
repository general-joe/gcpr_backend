/*
  Warnings:

  - You are about to drop the column `video` on the `RehabTask` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "appointmentStatus" ADD VALUE 'RESCHEDULED';

-- AlterTable
ALTER TABLE "RehabTask" DROP COLUMN "video",
ADD COLUMN     "videoUrl" TEXT;
