import { scoreGMFM88 } from "./gmfm.scoring.js";
import { scoreSLT } from "./slt.scoring.js";
import { scorePhysiotherapy } from "./physiotherapy.scoring.js";
import { scoreOT } from "./ot.scoring.js";

export const SCORERS = {
  GMFM_88: scoreGMFM88,
  SLT_CP_BASELINE: scoreSLT,
  PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT: scorePhysiotherapy,
  OT_CP_CLINICAL_ASSESSMENT: scoreOT
};
