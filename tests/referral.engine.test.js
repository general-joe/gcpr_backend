import test from "node:test";
import assert from "node:assert/strict";

import { generateReferralRecommendations } from "../src/services/assessment/referral.engine.js";

test("recommends multidisciplinary referrals for low GMFM-88 dimensions", () => {
  const recommendations = generateReferralRecommendations({
    toolCode: "GMFM_88",
    scores: {
      totalScore: 28,
      dimensionProfiles: {
        A: {
          name: "Lying and Rolling",
          percentage: 45,
          clinicalBand: "Marked limitation",
        },
        B: {
          name: "Sitting",
          percentage: 75,
          clinicalBand: "Mild limitation",
        },
        E: {
          name: "Walking, Running and Jumping",
          percentage: 20,
          clinicalBand: "Severe limitation",
        },
      },
    },
  });

  assert.deepEqual(recommendations.dimensionFindings.map((finding) => finding.dimension), [
    "A",
    "E",
  ]);
  assert.ok(recommendations.suggestedProfessions.includes("PHYSIOTHERAPIST"));
  assert.ok(recommendations.suggestedProfessions.includes("PAEDIATRIC_NEUROLOGIST"));
  assert.ok(recommendations.suggestedProfessions.includes("DIETITIAN"));
  assert.match(recommendations.reasoning, /Multi-disciplinary referral is advised/);
});

test("returns standard profession mapping for section-based tools", () => {
  const recommendations = generateReferralRecommendations({
    toolCode: "DIETITIAN_NUTRITION_CONSULTATION",
  });

  assert.deepEqual(recommendations.suggestedProfessions, ["DIETITIAN"]);
  assert.deepEqual(recommendations.dimensionFindings, []);
  assert.equal(
    recommendations.reasoning,
    "Standard referral pathway for DIETITIAN_NUTRITION_CONSULTATION.",
  );
});

test("returns an empty advisory result when no mapping exists", () => {
  const recommendations = generateReferralRecommendations({
    toolCode: "UNMAPPED_TOOL",
  });

  assert.deepEqual(recommendations.suggestedProfessions, []);
  assert.equal(recommendations.reasoning, "No automated referral mapping available for this tool.");
});
