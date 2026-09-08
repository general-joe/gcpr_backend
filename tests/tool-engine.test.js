import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  configToSnapshot,
  validateSnapshotResponses,
  scoreSnapshotResponses,
  TOOL_SCORING,
} from "../src/modules/assessment/definitions/toolSchema.js";
import { generateCarePlanParamsSchema } from "../src/modules/carePlan/carePlan.validator.js";
import sltConfig from "../src/config/tools/slt-cp.config.js";
import gmfmConfig from "../src/config/tools/gmfm-88.config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readSrc = (rel) => readFileSync(path.join(__dirname, "..", rel), "utf8");

// Group 5 — Assessment-tool engine: real migration, not additive.
describe("Group 5 — Tool engine", () => {
  it("converter uses stable creation-time field keys (item ids, never positions)", () => {
    const a = configToSnapshot(sltConfig);
    const b = configToSnapshot(sltConfig);
    const keys = (s) => s.sections.flatMap((sec) => sec.fields.map((f) => f.fieldKey));
    assert.deepEqual(keys(a), keys(b));
    assert.ok(keys(a).includes("diagnosis") && keys(a).includes("speechClarity"));
    assert.ok(!keys(a).some((k) => /^[A-Z]\d+$/.test(k)), "position-derived keys leak into snapshot");
  });

  it("GMFM snapshot preserves all 88 required fields with strict 0-3/NT domain", () => {
    const snap = configToSnapshot(gmfmConfig);
    const itemFields = snap.sections
      .filter((s) => s.code !== "clinical_notes")
      .flatMap((s) => s.fields);
    assert.equal(itemFields.length, 88);
    assert.ok(itemFields.every((f) => f.validation?.required === true));
    assert.ok(itemFields.every((f) => JSON.stringify(f.validation?.allowedValues) === JSON.stringify([0, 1, 2, 3, "NT"])));
    assert.equal(TOOL_SCORING.GMFM_88.strategy, "CUSTOM_FN_REF");
  });

  it("validates field values server-side: rejects bad options, coerces numbers, ignores unknown keys", () => {
    const snap = configToSnapshot(sltConfig);
    const ok = validateSnapshotResponses(snap, {
      diagnosis: "CP",
      speechClarity: "Severe",
      pregnancyLengthWeeks: "26", // unknown key: ignored, forward-compatible
    });
    assert.equal(ok.valid, true);
    assert.deepEqual(ok.issues, []);
    const bad = validateSnapshotResponses(snap, { speechClarity: "Superb" });
    assert.equal(bad.valid, false);
    assert.ok(bad.issues.some((i) => i.fieldKey === "speechClarity"));
  });

  it("scores SUM/WEIGHTED_SUM from option scores x weights as data", () => {
    const snap = {
      sections: [
        {
          code: "S",
          title: "S",
          order: 0,
          fields: [
            {
              fieldKey: "gmfcs",
              order: 0,
              label: "GMFCS",
              fieldType: "SINGLE_CHOICE",
              options: [
                { value: "LEVEL_1", label: "I", score: 1 },
                { value: "LEVEL_5", label: "V", score: 5 },
              ],
              scoringWeight: 2,
            },
            { fieldKey: "notes", order: 1, label: "Notes", fieldType: "TEXT" },
          ],
        },
      ],
    };
    const scored = scoreSnapshotResponses(snap, "WEIGHTED_SUM", { gmfcs: "LEVEL_5", notes: "hi" });
    assert.equal(scored.total, 10);
    assert.equal(scored.fieldScores.gmfcs, 10);
  });

  it("care-plan generate validates assessmentId param", () => {
    assert.throws(() => generateCarePlanParamsSchema.parse({ assessmentId: "nope" }));
    assert.equal(
      generateCarePlanParamsSchema.parse({ assessmentId: "11111111-1111-4111-8111-111111111111" }).assessmentId,
      "11111111-1111-4111-8111-111111111111",
    );
  });

  it("runtime reads published snapshots exclusively; legacy tables/routes are gone", () => {
    const svc = readSrc("src/modules/assessment/assessment.service.js");
    assert.doesNotMatch(svc, /ALL_TOOL_CONFIGS/, "still reads hardcoded ALL_TOOL_CONFIGS");
    assert.match(svc, /getPublishedTool|published/i, "submit/form do not read published versions");
    assert.match(svc, /toolVersion.*version|version.*toolVersion/i, "submit does not record used version");
    const schema = readSrc("prisma/schema.prisma");
    assert.doesNotMatch(schema, /model AssessmentToolProfession|model AssessmentTool /, "legacy tables still present");
    assert.match(schema, /model AssessmentToolDefinition/, "new definition tables missing");
    const adminRoute = readSrc("src/modules/admin/admin.route.js");
    assert.doesNotMatch(adminRoute, /"\/assessment-tools"|listAssessmentTools|createToolSchema/, "redundant old admin routes still present");
  });
});
