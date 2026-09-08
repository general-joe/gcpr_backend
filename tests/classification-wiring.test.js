import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { submitAssessmentSchema } from "../src/modules/assessment/assessment.validator.js";
import { createFunctionalClassificationSchema } from "../src/modules/functionalClassification/functionalClassification.validator.js";
import { generateReferralRecommendations } from "../src/services/assessment/referral.engine.js";
import {
  TOOL_CLASSIFICATION_SCALES,
  STALENESS_MONTHS,
  isClassificationStale,
  branchCarePlanIntensity,
} from "../src/services/assessment/classificationPolicy.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readSrc = (rel) => readFileSync(path.join(__dirname, "..", rel), "utf8");

// Group 4 — Functional classification wired into the live pipeline.
describe("Group 4 — Classification wiring", () => {
  it("submit accepts an optional functionalClassificationId", () => {
    const parsed = submitAssessmentSchema.parse({
      patientId: "11111111-1111-4111-8111-111111111111",
      toolCode: "GMFM_88",
      responses: { A1: 3 },
      functionalClassificationId: "22222222-2222-4222-8222-222222222222",
    });
    assert.equal(parsed.functionalClassificationId, "22222222-2222-4222-8222-222222222222");
  });

  it("classification create accepts assessmentId and rejects future assessedAt", () => {
    const parsed = createFunctionalClassificationSchema.parse({
      patientId: "11111111-1111-4111-8111-111111111111",
      classifier: "GMFCS",
      level: 3,
      assessedAt: new Date("2024-01-01"),
      assessmentId: "22222222-2222-4222-8222-222222222222",
    });
    assert.equal(parsed.assessmentId, "22222222-2222-4222-8222-222222222222");
    assert.throws(() =>
      createFunctionalClassificationSchema.parse({
        patientId: "11111111-1111-4111-8111-111111111111",
        classifier: "GMFCS",
        level: 3,
        assessedAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }),
    );
  });

  it("tool-to-scale map covers the clinical tools", () => {
    assert.ok(TOOL_CLASSIFICATION_SCALES.GMFM_88.includes("GMFCS"));
    assert.ok(TOOL_CLASSIFICATION_SCALES.OT_CP_CLINICAL_ASSESSMENT.includes("MACS"));
    assert.equal(STALENESS_MONTHS, 12);
  });

  it("staleness flags classifications older than 12 months", () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 13);
    const recent = new Date();
    recent.setMonth(recent.getMonth() - 1);
    assert.equal(isClassificationStale(old), true);
    assert.equal(isClassificationStale(recent), false);
    assert.equal(isClassificationStale(null), true);
  });

  it("referral recommendations weight classification level, not just GMFM cutoffs", () => {
    const perfect = {
      dimensionProfiles: {
        A: { percentage: 100, name: "Lying", clinicalBand: "normal" },
        B: { percentage: 100, name: "Sitting", clinicalBand: "normal" },
        C: { percentage: 100, name: "Crawling", clinicalBand: "normal" },
        D: { percentage: 100, name: "Standing", clinicalBand: "normal" },
        E: { percentage: 100, name: "Walking", clinicalBand: "normal" },
      },
      totalScore: 100,
    };
    const result = generateReferralRecommendations({
      toolCode: "GMFM_88",
      scores: perfect,
      classification: { classifier: "GMFCS", level: 5 },
    });
    assert.ok(result.suggestedProfessions.includes("REHABILITATION_PAEDIATRICIAN"));
    assert.ok(Array.isArray(result.classificationFindings) && result.classificationFindings.length > 0);
  });

  it("care-plan intensity branches on classification level", () => {
    assert.deepEqual(branchCarePlanIntensity({ classifier: "GMFCS", level: 5 }), {
      intensity: "enhanced",
      reviewWeeks: 8,
    });
    assert.deepEqual(branchCarePlanIntensity({ classifier: "GMFCS", level: 1 }), {
      intensity: "standard",
      reviewWeeks: 12,
    });
    assert.deepEqual(branchCarePlanIntensity(null), { intensity: "standard", reviewWeeks: 12 });
  });

  it("submit persists the classification link; form surfaces scales + staleness", () => {
    const svc = readSrc("src/modules/assessment/assessment.service.js");
    assert.match(svc, /functionalClassificationId/, "submit never touches functionalClassificationId");
    assert.match(svc, /applicableScales/, "form never surfaces applicable scales");
    assert.match(svc, /stale/i, "form never surfaces staleness");
  });

  it("care-plan generation branches on classification; FC update/delete recompute outcomes", () => {
    assert.match(readSrc("src/services/clinical/carePlan.service.js"), /classification/i, "care-plan ignores classification");
    const fc = readSrc("src/modules/functionalClassification/functionalClassification.service.js");
    assert.match(fc, /recomput|recalc/i, "FC update/delete never recompute outcomes");
  });

  it("FC router is mounted and the list-query validator is wired", () => {
    assert.match(readSrc("src/routes/index.route.js"), /functional-classification|functionalClassification/i, "FC router not mounted");
    assert.match(
      readSrc("src/modules/functionalClassification/functionalClassification.route.js"),
      /listFunctionalClassificationsQuerySchema/,
      "list-query validator still unused",
    );
  });
});
