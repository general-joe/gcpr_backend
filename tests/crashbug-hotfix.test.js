import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import CpPatientService from "../src/modules/cpPatient/cpPatient.service.js";
import EnrollmentService from "../src/modules/cpPatient/enrollment.service.js";
import AdherenceService from "../src/modules/assessment/adherence.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readSrc = (rel) => readFileSync(path.join(__dirname, "..", rel), "utf8");

// Group 1 regression: error paths must throw the typed HTTP error
// (status + HttpException), never a bare ReferenceError from a missing import.
describe("Group 1 — crash-bug hotfix (missing gcprError/WRITE imports)", () => {
  it("CpPatientService.requireCaregiver(undefined) throws 401 HttpException, not ReferenceError", async () => {
    await assert.rejects(() => CpPatientService.requireCaregiver(undefined), (err) => {
      assert.notEqual(err.constructor.name, "ReferenceError", `got ReferenceError: ${err.message}`);
      assert.equal(err.status, 401);
      return true;
    });
  });

  it("EnrollmentService.updateEnrollment as CAREGIVER throws 403 HttpException, not ReferenceError", async () => {
    await assert.rejects(
      () => EnrollmentService.updateEnrollment({ userType: "CAREGIVER" }, "some-id", { status: "COMPLETED" }),
      (err) => {
        assert.notEqual(err.constructor.name, "ReferenceError", `got ReferenceError: ${err.message}`);
        assert.equal(err.status, 403);
        return true;
      },
    );
  });

  it("AdherenceService.updateLog as CAREGIVER throws 403 HttpException, not ReferenceError", async () => {
    await assert.rejects(() => AdherenceService.updateLog({ userType: "CAREGIVER" }, "t", "l", {}), (err) => {
      assert.notEqual(err.constructor.name, "ReferenceError", `got ReferenceError: ${err.message}`);
      assert.equal(err.status, 403);
      return true;
    });
  });

  it("cpPatient.service.js imports gcprError and WRITE (stray WRITE typo fixed)", () => {
    const src = readSrc("src/modules/cpPatient/cpPatient.service.js");
    assert.match(src, /import\s+gcprError\s+from\s+["']\.\.\/\.\.\/utils\/http-error\.js["']/);
    assert.match(src, /import\s+WRITE\s+from\s+["']\.\.\/\.\.\/utils\/logger\.js["']/);
  });

  it("enrollment.service.js and adherence.service.js import gcprError", () => {
    for (const f of [
      "src/modules/cpPatient/enrollment.service.js",
      "src/modules/assessment/adherence.service.js",
    ]) {
      assert.match(readSrc(f), /import\s+gcprError\s+from\s+["']\.\.\/\.\.\/utils\/http-error\.js["']/, f);
    }
  });
});
