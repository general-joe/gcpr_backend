import { gmfm88Config, sltCpBaselineConfig } from "../../config/tools/index.js";
import { SCORERS } from "./scorers/index.js";

export const processAssessment = ({ toolCode, responses }) => {
  const config = toolCode === "gmfm88" ? gmfm88Config : sltCpBaselineConfig;
  if (!config) {
    throw new Error(`Unknown assessment tool: ${toolCode}`);
  }

  const scorer = SCORERS[toolCode];

  // Tools like SLT may not produce numeric scores
  if (!scorer) {
    return {
      toolCode,
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
    toolCode,
    result,
    completedAt: new Date()
  };
};
