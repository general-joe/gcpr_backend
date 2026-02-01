/*
  Warnings:

  - You are about to drop the column `ip` on the `PasswordResetToken` table. All the data in the column will be lost.
  - You are about to drop the column `deviceInfo` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `ip` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `replacedBy` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the `OTP` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OTP" DROP CONSTRAINT "OTP_userId_fkey";

-- DropIndex
DROP INDEX "RefreshToken_userId_idx";

-- DropIndex
DROP INDEX "RefreshToken_userId_key";

-- AlterTable
ALTER TABLE "PasswordResetToken" DROP COLUMN "ip";

-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "deviceInfo",
DROP COLUMN "ip",
DROP COLUMN "reason",
DROP COLUMN "replacedBy",
DROP COLUMN "revokedAt",
DROP COLUMN "userAgent";

-- DropTable
DROP TABLE "OTP";

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Otp_userId_key" ON "Otp"("userId");

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
