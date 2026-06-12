-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReferralStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "ReferralStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "ClinicalReferral" ADD COLUMN     "escalatedAt" TIMESTAMP(3),
ADD COLUMN     "slaDeadline" TIMESTAMP(3);
