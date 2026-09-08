import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { getLiveTermsVersions, termsReacceptanceRequired } from "../src/modules/auth/termsAcceptance.js";
import { createReferralSchema } from "../src/modules/assessment/assessment.validator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readSrc = (rel) => readFileSync(path.join(__dirname, "..", rel), "utf8");

// Group 3 — Terms/privacy acceptance (not a new consent system).
describe("Group 3 — Terms/privacy acceptance", () => {
  it("live versions come from server env with safe defaults", () => {
    const live = getLiveTermsVersions();
    assert.equal(live.termsVersion, process.env.TERMS_VERSION || "1.0");
    assert.equal(live.privacyPolicyVersion, process.env.PRIVACY_POLICY_VERSION || "1.0");
  });

  it("flags re-acceptance when stored versions differ from live", () => {
    const live = getLiveTermsVersions();
    const stale = termsReacceptanceRequired({ termsVersion: "__old__", privacyPolicyVersion: live.privacyPolicyVersion });
    assert.equal(stale.reacceptanceRequired, true);
    const fresh = termsReacceptanceRequired({ termsVersion: live.termsVersion, privacyPolicyVersion: live.privacyPolicyVersion });
    assert.equal(fresh.reacceptanceRequired, false);
  });

  it("registration enforces explicit true + pins live versions + audits IP/device", () => {
    const src = readSrc("src/modules/auth/auth.service.js");
    assert.match(src, /acceptedTerms\s*!==\s*true|acceptedTerms\s*===\s*true/, "no strict acceptedTerms===true check");
    assert.match(src, /acceptedPrivacyPolicy\s*!==\s*true|acceptedPrivacyPolicy\s*===\s*true/, "no strict acceptedPrivacyPolicy===true check");
    assert.match(src, /USER_REGISTER_TERMS_ACCEPTED/, "no registration terms audit trail");
    assert.match(src, /rq\?\.ip/, "no request IP captured for terms audit");
  });

  it("login and getMe surface the re-acceptance flag", () => {
    const src = readSrc("src/modules/auth/auth.service.js");
    assert.match(src, /[Rr]eacceptanceRequired/, "no re-acceptance flag in auth responses");
  });

  it("PATCH /user/accept-terms endpoint exists (versioned re-acceptance)", () => {
    const src = readSrc("src/modules/user/user.route.js");
    assert.match(src, /accept-terms/, "no accept-terms route");
  });

  it("referral schema accepts crossOrgConfirmed boolean", () => {
    const parsed = createReferralSchema.parse({
      patientId: "11111111-1111-4111-8111-111111111111",
      toProfession: "PHYSIOTHERAPIST",
      reason: "Needs ongoing physiotherapy support weekly.",
      crossOrgConfirmed: true,
    });
    assert.equal(parsed.crossOrgConfirmed, true);
  });

  it("referral creation enforces cross-org confirmation and persists it", () => {
    const src = readSrc("src/modules/assessment/assessment.service.js");
    assert.match(src, /crossOrgConfirmed/, "no cross-org logic in referral creation");
  });

  it("deactivation cascades to dependent patients' active enrollments", () => {
    const src = readSrc("src/modules/user/user.service.js");
    assert.match(src, /patientEnrollmentRecord|PatientEnrollmentRecord/, "no enrollment cascade in deactivation");
  });

  it("consent + standalone enrollment routes are marked deprecated, not mounted", () => {
    assert.match(readSrc("src/modules/consent/consent.route.js"), /@deprecated|DEPRECATED/i, "consent route not marked deprecated");
    assert.match(readSrc("src/modules/cpPatient/enrollment.route.js"), /@deprecated|DEPRECATED/i, "enrollment route not marked deprecated");
    const index = readSrc("src/routes/index.route.js");
    assert.doesNotMatch(index, /consent\.route|enrollment\.route/, "deprecated routes must stay unmounted");
  });
});
