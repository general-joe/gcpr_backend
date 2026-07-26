CREATE INDEX IF NOT EXISTS "TelehealthRoom_status_scheduledStart_deletedAt_idx"
ON "TelehealthRoom"("status", "scheduledStart", "deletedAt");
