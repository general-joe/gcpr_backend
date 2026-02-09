import { scoreGMFM88 } from "./gmfm.scoring.js";
import { scoreSLT } from "./slt.scoring.js";

export const SCORERS = {
  GMFM_88: scoreGMFM88,
  SLT_CP_BASELINE: scoreSLT
};
