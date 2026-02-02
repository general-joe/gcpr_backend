/*
  Warnings:

  - You are about to drop the column `profession` on the `serviceProvider` table. All the data in the column will be lost.
  - Changed the type of `licenseType` on the `serviceProvider` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "serviceProvider" DROP COLUMN "profession",
DROP COLUMN "licenseType",
ADD COLUMN     "licenseType" "Profession" NOT NULL;
