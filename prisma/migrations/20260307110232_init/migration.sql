/*
  Warnings:

  - You are about to drop the column `reasontext` on the `Appointment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "reasontext",
ADD COLUMN     "reasonText" TEXT;
