import test from "node:test";
import assert from "node:assert/strict";

import {
  getToolConfigByCode,
  processAssessment,
} from "../src/services/assessment/assessment.service.js";

const buildGmfmResponses = (score = 3) => {
  const responses = {};
  const ranges = {
    A: [1, 17],
    B: [18, 37],
    C: [38, 51],
    D: [52, 64],
    E: [65, 88],
  };

  for (const [dimension, [start, end]] of Object.entries(ranges)) {
    for (let item = start; item <= end; item += 1) {
      responses[`${dimension}${item}`] = score;
    }
  }

  return responses;
};

test("normalizes known assessment tool aliases", () => {
  assert.equal(getToolConfigByCode("GMFM-88").normalizedToolCode, "GMFM_88");
  assert.equal(getToolConfigByCode("gmfm88").normalizedToolCode, "GMFM_88");
  assert.equal(
    getToolConfigByCode("slt-cp-baseline").normalizedToolCode,
    "SLT_CP_BASELINE",
  );
});

test("throws a descriptive error for unsupported tools", () => {
  assert.throws(
    () => processAssessment({ toolCode: "UNKNOWN_TOOL", responses: {} }),
    /Unknown assessment tool: UNKNOWN_TOOL/,
  );
});

test("scores a complete GMFM-88 response at 100 percent", () => {
  const assessment = processAssessment({
    toolCode: "GMFM88",
    responses: buildGmfmResponses(3),
  });

  assert.equal(assessment.toolCode, "GMFM_88");
  assert.equal(assessment.result.scores.totalScore, 100);
  assert.equal(assessment.result.scores.overallClinicalBand, "Near-complete function");
  assert.equal(assessment.result.scores.dimensionProfiles.A.testedItems, 17);
  assert.equal(assessment.result.scores.dimensionProfiles.E.testedItems, 24);
  assert.match(assessment.result.summary, /GMFM-88 total score 100%/);
  assert.ok(assessment.completedAt instanceof Date);
});

test("excludes GMFM-88 not-tested items from adjusted maximum score", () => {
  const responses = buildGmfmResponses(3);
  responses.A1 = "NT";
  responses.A2 = "NT";

  const assessment = processAssessment({
    toolCode: "GMFM_88",
    responses,
  });

  const profile = assessment.result.scores.dimensionProfiles.A;
  assert.equal(profile.notTestedItems, 2);
  assert.equal(profile.testedItems, 15);
  assert.equal(profile.adjustedMaxScore, 45);
  assert.equal(profile.percentage, 100);
});

test("returns structured clinical output for physiotherapy assessments", () => {
  const assessment = processAssessment({
    toolCode: "paediatric-physiotherapy-assessment",
    responses: {
      gmfcsLevel: "III",
      tone: "Hypertonia",
      primitiveReflexes: "Persistent",
      treatmentPlan: "Daily stretching and caregiver-led positioning.",
      physiotherapyDiagnosis: "Spastic diplegia",
    },
  });

  assert.equal(assessment.toolCode, "PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT");
  assert.equal(assessment.result.scores.gmfcsLevel, "III");
  assert.equal(assessment.result.scores.diagnosis, "Spastic diplegia");
  assert.match(assessment.result.summary, /GMFCS Level III/);
  assert.ok(
    assessment.result.recommendations.some((recommendation) =>
      recommendation.includes("spasticity management"),
    ),
  );
});

test("scores occupational therapy ADL dependence and risk recommendations", () => {
  const assessment = processAssessment({
    toolCode: "OT_CP_CLINICAL_ASSESSMENT",
    responses: {
      gmfcsLevel: "LEVEL_4",
      modifiedAshworthScale: "MAS_3",
      selfFeeding: "UNABLE",
      dressingUpper: "NEED_ADAPTATIONS",
      bathing: "UNABLE",
      stairsInsideHouse: "Yes",
      bedroomAccess: "Higher Level - stairs required",
      accessibilityIssues: "Narrow bathroom doorway",
      equipmentInUse: ["Wheelchair", "Standing frame"],
    },
  });

  assert.equal(assessment.result.scores.gmfcsScore, 4);
  assert.equal(assessment.result.scores.modifiedAshworthScore, 3);
  assert.equal(assessment.result.scores.assessedAdls, 3);
  assert.equal(assessment.result.scores.totalAdlScore, 8);
  assert.equal(assessment.result.scores.adlAverageScore, 2.67);
  assert.ok(
    assessment.result.recommendations.some((recommendation) =>
      recommendation.includes("powered mobility assessment"),
    ),
  );
  assert.ok(
    assessment.result.recommendations.some((recommendation) =>
      recommendation.includes("Elevated spasticity"),
    ),
  );
});
