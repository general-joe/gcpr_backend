-- CreateTable
CREATE TABLE "AppointmentSettings" (
    "id" TEXT NOT NULL,
    "allowPatientBooking" BOOLEAN NOT NULL DEFAULT true,
    "minAppointmentNotice" INTEGER NOT NULL DEFAULT 24,
    "defaultDuration" INTEGER NOT NULL DEFAULT 30,
    "bufferTime" INTEGER NOT NULL DEFAULT 15,
    "maxDailyAppointments" INTEGER NOT NULL DEFAULT 20,
    "enableReminders" BOOLEAN NOT NULL DEFAULT true,
    "reminderLeadTime" INTEGER NOT NULL DEFAULT 2,
    "requireConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "enableWaitlist" BOOLEAN NOT NULL DEFAULT true,
    "slotInterval" INTEGER NOT NULL DEFAULT 30,
    "workingHours" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentSettings_updatedAt_idx" ON "AppointmentSettings"("updatedAt");
