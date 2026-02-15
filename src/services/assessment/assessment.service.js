import {
  gmfm88Config,
  sltCpBaselineConfig,
  paediatricPhysiotherapyAssessmentConfig,
  homeRehabPharmacyConfig,
  cpProgramIntakeConfig,
  otCpClinicalAssessmentConfig
} from "../../config/tools/index.js";
import { SCORERS } from "./scorers/index.js";

const TOOL_ALIASES = {
  GMFM88: "GMFM_88",
  GMFM_88: "GMFM_88",
  "GMFM-88": "GMFM_88",
  gmfm88: "GMFM_88",
  gmfm_88: "GMFM_88",
  "gmfm-88": "GMFM_88",
  SLT_CP_BASELINE: "SLT_CP_BASELINE",
  "SLT-CP-BASELINE": "SLT_CP_BASELINE",
  slt_cp_baseline: "SLT_CP_BASELINE",
  "slt-cp-baseline": "SLT_CP_BASELINE",
  sltCpBaseline: "SLT_CP_BASELINE",
  PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT: "PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT",
  paediatric_physiotherapy_assessment: "PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT",
  "paediatric-physiotherapy-assessment": "PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT",
  OT_CP_CLINICAL_ASSESSMENT: "OT_CP_CLINICAL_ASSESSMENT",
  ot_cp_clinical_assessment: "OT_CP_CLINICAL_ASSESSMENT",
  "ot-cp-clinical-assessment": "OT_CP_CLINICAL_ASSESSMENT",
  CP_PROGRAM_INTAKE: "CP_PROGRAM_INTAKE",
  cp_program_intake: "CP_PROGRAM_INTAKE",
  "cp-program-intake": "CP_PROGRAM_INTAKE",
  HOME_REHAB_PHARMACY_PRESCRIPTION: "HOME_REHAB_PHARMACY_PRESCRIPTION",
  home_rehab_pharmacy_prescription: "HOME_REHAB_PHARMACY_PRESCRIPTION",
  "home-rehab-pharmacy-prescription": "HOME_REHAB_PHARMACY_PRESCRIPTION"
};

const TOOL_CONFIGS = {
  GMFM_88: gmfm88Config,
  SLT_CP_BASELINE: sltCpBaselineConfig,
  PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT: paediatricPhysiotherapyAssessmentConfig,
  OT_CP_CLINICAL_ASSESSMENT: otCpClinicalAssessmentConfig,
  CP_PROGRAM_INTAKE: cpProgramIntakeConfig,
  HOME_REHAB_PHARMACY_PRESCRIPTION: homeRehabPharmacyConfig
};

const normalizeToolCode = (toolCode) =>
  TOOL_ALIASES[toolCode] ?? toolCode;

export const getToolConfigByCode = (toolCode) => {
  const normalizedToolCode = normalizeToolCode(toolCode);
  return {
    normalizedToolCode,
    config: TOOL_CONFIGS[normalizedToolCode] ?? null
  };
};

export const processAssessment = ({ toolCode, responses }) => {
  const { normalizedToolCode, config } = getToolConfigByCode(toolCode);
  if (!config) {
    throw new Error(
      `Unknown assessment tool: ${toolCode}. Supported tools: ${Object.keys(TOOL_CONFIGS).join(", ")}`
    );
  }

  const scorer = SCORERS[normalizedToolCode];

  // Tools like SLT may not produce numeric scores
  if (!scorer) {
    return {
      toolCode: normalizedToolCode,
      result: null,
      message: "No scoring logic available for this tool",
      completedAt: new Date()
    };
  }

  const result = scorer({
    responses,
    config
  });

  return {
    toolCode: normalizedToolCode,
    result,
    completedAt: new Date()
  };
};
