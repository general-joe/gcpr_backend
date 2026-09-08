import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { seedAdmin } from "../scripts/seed-admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readSrc = (rel) => readFileSync(path.join(__dirname, "..", rel), "utf8");
const pkg = JSON.parse(readSrc("package.json"));

// Group 8 — Secret hygiene: no baked-in seed credentials.
describe("Group 8 — Secret hygiene", () => {
  const savedEmail = process.env.SEED_ADMIN_EMAIL;
  const savedPassword = process.env.SEED_ADMIN_PASSWORD;
  beforeEach(() => {
    delete process.env.SEED_ADMIN_EMAIL;
    delete process.env.SEED_ADMIN_PASSWORD;
  });
  afterEach(() => {
    if (savedEmail !== undefined) process.env.SEED_ADMIN_EMAIL = savedEmail;
    else delete process.env.SEED_ADMIN_EMAIL;
    if (savedPassword !== undefined) process.env.SEED_ADMIN_PASSWORD = savedPassword;
    else delete process.env.SEED_ADMIN_PASSWORD;
  });

  it("seed script refuses to run without env credentials (no baked-in default)", async () => {
    await assert.rejects(() => seedAdmin(), /SEED_ADMIN_EMAIL|credentials|not set/i);
  });

  it("seed script rejects weak env passwords", async () => {
    process.env.SEED_ADMIN_EMAIL = "admin@example.com";
    process.env.SEED_ADMIN_PASSWORD = "weak";
    await assert.rejects(() => seedAdmin(), /password|complexity|weak/i);
  });

  it("no hardcoded admin email/password literals remain in the seed script", () => {
    const src = readSrc("scripts/seed-admin.js");
    assert.doesNotMatch(src, /oklement3@gmail\.com/, "hardcoded email still present");
    assert.doesNotMatch(src, /Pass123\$1/, "hardcoded password still present");
    assert.doesNotMatch(src, /console\.log\(`Password/, "seed prints the password");
  });

  it("no login-time admin auto-provisioning backdoor remains in auth", () => {
    const src = readSrc("src/modules/auth/auth.service.js");
    assert.doesNotMatch(src, /oklement3@gmail\.com/, "hardcoded admin email still present in auth");
    assert.doesNotMatch(src, /isAdminEmail/, "admin-email backdoor branch still present");
  });

  it("secret scanning is wired into scripts and CI", () => {
    assert.ok(pkg.scripts["secret:scan"], "no secret:scan npm script");
    const ci = readSrc(".github/workflows/ci.yml");
    assert.match(ci, /secret:scan|secret-scan|gitleaks/i, "CI does not run secret scanning");
  });
});
