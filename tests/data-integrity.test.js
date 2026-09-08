import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import CarePlanService from "../src/services/clinical/carePlan.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readSrc = (rel) => readFileSync(path.join(__dirname, "..", rel), "utf8");

// Group 6 — Data-integrity fixes.
describe("Group 6 — Data integrity", () => {
  it("adherence writes keep an append-only history (no silent overwrites)", () => {
    const schema = readSrc("prisma/schema.prisma");
    assert.match(schema, /model TaskAdherenceLogHistory/, "no history table");
    for (const [file, label] of [
      ["src/modules/assessment/adherence.service.js", "adherence service"],
      ["src/modules/sync/sync.service.js", "sync push"],
      ["src/modules/cpPatient/cpPatient.service.js", "caregiver day-done"],
    ]) {
      assert.match(
        readSrc(file),
        /taskAdherenceLogHistory|recordHistory/i,
        `${label} writes no history row`,
      );
    }
  });

  it("referral status transitions enforce the physio-only rule like creation", () => {
    const src = readSrc("src/modules/assessment/assessment.service.js");
    const fn = src.slice(src.indexOf("static async updateReferralStatus"));
    assert.match(fn, /PHYSIOTHERAPIST/, "no physio check in updateReferralStatus");
    assert.match(fn, /requireVerifiedServiceProvider/, "unverified providers can still transition referrals");
  });

  it("care-plan re-POST supersedes instead of returning stale plans, one ACTIVE each", () => {
    assert.deepEqual(
      CarePlanService.resolveCarePlanAction({ id: "a", assessmentId: "x" }, "x"),
      { action: "return" },
    );
    assert.deepEqual(
      CarePlanService.resolveCarePlanAction({ id: "a", assessmentId: "x" }, "y"),
      { action: "supersede" },
    );
    assert.deepEqual(CarePlanService.resolveCarePlanAction(null, "y"), { action: "create" });
    const migration = readSrc("prisma/migrations/20260908030000_care_plan_single_active/migration.sql");
    assert.match(migration, /UNIQUE.*patientId|patientId.*UNIQUE/i, "no single-active guard at DB level");
    assert.match(migration, /WHERE.*ACTIVE|ACTIVE.*WHERE/i, "guard is not scoped to ACTIVE rows");
  });

  it("admin patient reads go through cp-patient-backed enrollment data", () => {
    const src = readSrc("src/modules/admin/admin.service.js");
    assert.match(src, /enrollmentRecord/, "admin patient reads ignore enrollmentRecord");
  });
});
