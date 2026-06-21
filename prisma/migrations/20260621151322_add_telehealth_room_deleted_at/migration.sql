-- AlterTable
ALTER TABLE "TelehealthIntegration" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TelehealthOAuthToken" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TelehealthRoom" ADD COLUMN     "deletedAt" TIMESTAMP(3);
