/**
 * Classification policy helpers (Group 4) — pure functions, no DB.
 *
 * Maps each assessment tool to the functional classification scale(s) that
 * clinically inform it, defines the 12-month staleness rule for paediatric
 * re-assessment, weights referral routing by classification level, and
 * branches care-plan intensity. Kept data-driven so the Group 5 tool
 * engine can migrate this map into `assessment_tool_definitions`.
 */

// Which classification scale(s) clinically inform each tool.
export const TOOL_CLASSIFICATION_SCALES = {
  GMFM_88: ["GMFCS"],
  PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT: ["GMFCS"],
  OT_CP_CLINICAL_ASSESSMENT: ["MACS"],
  SLT_CP_BASELINE: ["CFCS", "VIKING_SPEECH_SCALE"],
  CP_PROGRAM_INTAKE: ["GMFCS", "MACS", "CFCS"],
  HOME_REHAB_PHARMACY_PRESCRIPTION: [],
  DIETITIAN_NUTRITION_CONSULTATION: ["EDACS"],
};

export const STALENESS_MONTHS = 12;

/** True when there is no classification or it is older than 12 months. */
export const isClassificationStale = (assessedAt) => {
  if (!assessedAt) return true;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - STALENESS_MONTHS);
  return new Date(assessedAt) < cutoff;
};

// Level-driven referral weighting per scale (levels IV–V escalate).
// Returns { professions, findings } for the referral engine to merge.
export const weightingForClassification = (classification) => {
  if (!classification || !classification.classifier || classification.level == null) {
    return { professions: [], findings: [] };
  }
  const { classifier, level } = classification;
  const professions = new Set();
  const findings = [];
  const push = (professionsForScale, note) => {
    professionsForScale.forEach((p) => professions.add(p));
    findings.push({ classifier, level, suggestedProfessions: professionsForScale, note });
  };

  if (classifier === "GMFCS" && level >= 4) {
    push(
      ["REHABILITATION_PAEDIATRICIAN", "OCCUPATIONAL_THERAPIST"],
      `GMFCS Level ${level}: limited independent mobility — multidisciplinary review advised alongside GMFM findings.`,
    );
  }
  if (classifier === "MACS" && level >= 3) {
    push(
      ["OCCUPATIONAL_THERAPIST"],
      `MACS Level ${level}: reduced manual ability — occupational therapy input advised.`,
    );
  }
  if ((classifier === "CFCS" || classifier === "VIKING_SPEECH_SCALE") && level >= 3) {
    push(
      ["SPEECH_THERAPIST"],
      `${classifier} Level ${level}: communication support needs — speech therapy review advised.`,
    );
  }
  if (classifier === "EDACS" && level >= 3) {
    push(
      ["DIETITIAN"],
      `EDACS Level ${level}: eating/drinking support needs — dietitian review advised.`,
    );
  }
  return { professions: [...professions], findings };
};

/**
 * Care-plan intensity branch. Conservative and data-driven: severe motor
 * involvement (GMFCS/MACS IV–V) shortens the review cycle so progress is
 * checked sooner. Clinical-content coordination may refine these bands.
 */
export const branchCarePlanIntensity = (classification) => {
  const level = classification?.level;
  const classifier = classification?.classifier;
  if ((classifier === "GMFCS" || classifier === "MACS") && level >= 4) {
    return { intensity: "enhanced", reviewWeeks: 8 };
  }
  return { intensity: "standard", reviewWeeks: 12 };
};
