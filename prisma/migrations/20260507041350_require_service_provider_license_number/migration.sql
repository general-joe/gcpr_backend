/*
  Warnings:

  - Made the column `licenseNumber` on table `serviceProvider` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "serviceProvider" ALTER COLUMN "licenseNumber" SET NOT NULL;
