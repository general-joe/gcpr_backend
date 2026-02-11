import { gmfm88Config, sltCpBaselineConfig } from "../../config/tools/index.js";
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
  sltCpBaseline: "SLT_CP_BASELINE"
};

const TOOL_CONFIGS = {
  GMFM_88: gmfm88Config,
  SLT_CP_BASELINE: sltCpBaselineConfig
};

const normalizeToolCode = (toolCode) =>
  TOOL_ALIASES[toolCode] ?? toolCode;

export const processAssessment = ({ toolCode, responses }) => {
  const normalizedToolCode = normalizeToolCode(toolCode);
  const config = TOOL_CONFIGS[normalizedToolCode];
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
