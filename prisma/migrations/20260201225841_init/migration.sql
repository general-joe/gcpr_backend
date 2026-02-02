/*
  Warnings:

  - Added the required column `profession` to the `serviceProvider` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `licenseType` on the `serviceProvider` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "serviceProvider" ADD COLUMN     "profession" "Profession" NOT NULL,
DROP COLUMN "licenseType",
ADD COLUMN     "licenseType" "ProfessionalBody" NOT NULL;
