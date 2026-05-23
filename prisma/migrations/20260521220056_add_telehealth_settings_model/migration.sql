-- CreateTable
CREATE TABLE "TelehealthSettings" (
    "id" TEXT NOT NULL,
    "enableTelehealth" BOOLEAN NOT NULL DEFAULT true,
    "defaultProviderMinutes" INTEGER NOT NULL DEFAULT 30,
    "maxConcurrentSessions" INTEGER NOT NULL DEFAULT 5,
    "recordingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "waitingRoomEnabled" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 30,
    "connectTimeout" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelehealthSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TelehealthSettings_updatedAt_idx" ON "TelehealthSettings"("updatedAt");
