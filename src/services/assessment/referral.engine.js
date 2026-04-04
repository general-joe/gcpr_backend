/**
 * Referral Engine
 *
 * Analyses a completed assessment report and returns profession-level
 * referral recommendations.  The engine does NOT create database records –
 * it only produces advisory output that the calling service can present
 * to the clinician for review before creating a ClinicalReferral.
 */

// Maps GMFM-88 dimension codes to the professions most relevant when
// that dimension shows marked or severe limitation.
const GMFM_DIMENSION_PROFESSIONS = {
  A: ["PHYSIOTHERAPIST", "REHABILITATION_PAEDIATRICIAN"],
  B: ["PHYSIOTHERAPIST", "OCCUPATIONAL_THERAPIST"],
  C: ["PHYSIOTHERAPIST"],
  D: ["PHYSIOTHERAPIST", "REHABILITATION_PAEDIATRICIAN"],
  E: ["PHYSIOTHERAPIST", "REHABILITATION_PAEDIATRICIAN"]
};

// Generic tool-to-profession mapping for non-scored / section-based tools.
const TOOL_PROFESSION_MAP = {
  SLT_CP_BASELINE: ["SPEECH_THERAPIST"],
  PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT: ["PHYSIOTHERAPIST", "REHABILITATION_PAEDIATRICIAN"],
  OT_CP_CLINICAL_ASSESSMENT: ["OCCUPATIONAL_THERAPIST"],
  CP_PROGRAM_INTAKE: [
    "GENERAL_PAEDIATRICIAN",
    "DEVELOPMENTAL_PAEDIATRICIAN",
    "PHYSIOTHERAPIST",
    "OCCUPATIONAL_THERAPIST",
    "SPEECH_THERAPIST"
  ],
  HOME_REHAB_PHARMACY_PRESCRIPTION: ["PHARMACIST"],
  DIETITIAN_NUTRITION_CONSULTATION: ["DIETITIAN"]
};

/**
 * Analyse a GMFM-88 scoring result and derive referral recommendations.
 */
const analyseGMFM = (scores) => {
  const recommendations = [];
  const professionSet = new Set();
  const dimensionProfiles = scores?.dimensionProfiles ?? {};

  for (const [code, profile] of Object.entries(dimensionProfiles)) {
    if (profile.percentage < 50) {
      const professions = GMFM_DIMENSION_PROFESSIONS[code] ?? [];
      professions.forEach((p) => professionSet.add(p));
      recommendations.push({
        dimension: code,
        dimensionName: profile.name,
        percentage: profile.percentage,
        band: profile.clinicalBand,
        suggestedProfessions: professions
      });
    }
  }

  // If overall score is below 50 %, also flag paediatric neurology.
  const totalScore = scores?.totalScore ?? 100;
  if (totalScore < 50) {
    professionSet.add("PAEDIATRIC_NEUROLOGIST");
    professionSet.add("REHABILITATION_PAEDIATRICIAN");
  }

  // Always suggest dietitian if overall function is severely limited.
  if (totalScore < 30) {
    professionSet.add("DIETITIAN");
  }

  return {
    suggestedProfessions: [...professionSet],
    dimensionFindings: recommendations,
    reasoning:
      recommendations.length > 0
        ? `Moderate-to-severe limitation detected in ${recommendations.length} dimension(s). Multi-disciplinary referral is advised.`
        : "No dimension below 50 %. Routine follow-up recommended."
  };
};

/**
 * For section-based (non-scored) tools, return the static profession mapping.
 */
const analyseGenericTool = (toolCode) => {
  const professions = TOOL_PROFESSION_MAP[toolCode] ?? [];
  return {
    suggestedProfessions: professions,
    dimensionFindings: [],
    reasoning: professions.length > 0
      ? `Standard referral pathway for ${toolCode}.`
      : "No automated referral mapping available for this tool."
  };
};

/**
 * Main entry point.
 *
 * @param {object} params
 * @param {string} params.toolCode  – normalised assessment tool code
 * @param {object} [params.scores]  – the `scores` object from processAssessment result
 * @returns {{ suggestedProfessions: string[], dimensionFindings: object[], reasoning: string }}
 */
export const generateReferralRecommendations = ({ toolCode, scores }) => {
  if (toolCode === "GMFM_88" && scores) {
    return analyseGMFM(scores);
  }

  return analyseGenericTool(toolCode);
};
