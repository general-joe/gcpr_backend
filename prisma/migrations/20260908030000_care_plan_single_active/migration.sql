-- Group 6: exactly one ACTIVE care plan per patient. Re-POST generate() now
-- explicitly supersedes the previous plan; this partial unique index is the
-- DB-level backstop against check-then-act races creating duplicates.
CREATE UNIQUE INDEX "carePlan_patient_single_active" ON "carePlan"("patientId") WHERE "status" = 'ACTIVE';
