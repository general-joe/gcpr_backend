import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import swaggerSpec from "../src/config/swagger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readSrc = (rel) => readFileSync(path.join(__dirname, "..", rel), "utf8");

// Group 7 — Swagger organized by system flow, not files/alphabet.
const EXPECTED_TAG_ORDER = [
  "Auth & Onboarding",
  "Profile Completion",
  "Patient Enrollment",
  "Clinical Assessment",
  "Referrals & Care Plans",
  "Tasks & Adherence",
  "Appointments & Telehealth",
  "Ongoing Platform",
  "Sync",
  "Admin & RBAC",
];

describe("Group 7 — Swagger flow organization", () => {
  it("tags follow the system-flow order with flow descriptions", () => {
    const names = swaggerSpec.tags.map((t) => t.name);
    assert.deepEqual(names, EXPECTED_TAG_ORDER);
    for (const tag of swaggerSpec.tags) {
      assert.ok(
        tag.description && tag.description.length > 100,
        `${tag.name} needs a 2-4 sentence flow description`,
      );
    }
  });

  it("every documented operation uses a defined flow section", () => {
    const defined = new Set(EXPECTED_TAG_ORDER);
    const violations = [];
    for (const [route, methods] of Object.entries(swaggerSpec.paths || {})) {
      for (const [method, op] of Object.entries(methods)) {
        for (const tag of op.tags || []) {
          if (!defined.has(tag)) violations.push(`${method.toUpperCase()} ${route} -> ${tag}`);
        }
      }
    }
    assert.deepEqual(violations, []);
  });

  it("key endpoints state their place in sequence", () => {
    const authSwagger = readSrc("src/modules/auth/auth.swagger.js");
    assert.match(authSwagger, /acceptedTerms/, "register doc omits terms/privacy acceptance fields");
    const submitOp = JSON.stringify(swaggerSpec.paths);
    assert.match(submitOp, /crossOrgConfirmed/, "referral doc omits crossOrgConfirmed");
    const supportSwagger = readSrc("src/modules/sync/sync.swagger.js");
    assert.match(supportSwagger, /dedupe|idempoten/i, "sync doc omits idempotency guarantees");
  });
});
