ALTER TABLE "RehabTask"
ADD COLUMN "carePlanId" TEXT;

CREATE INDEX "RehabTask_carePlanId_idx" ON "RehabTask"("carePlanId");

ALTER TABLE "RehabTask"
ADD CONSTRAINT "RehabTask_carePlanId_fkey"
FOREIGN KEY ("carePlanId") REFERENCES "carePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
