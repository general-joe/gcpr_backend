import { sltCpBaselineSections } from "./slt-cp.sections.js";

export default {
  "toolCode": "SLT_CP_BASELINE",
  "toolName": "Speech and Language Therapy Assessment – Cerebral Palsy",
  "version": "1.0.0",
  "sections": sltCpBaselineSections,
  "referralTriggers": [
    "feedingDifficulty",
    "severeSpeechClarity",
    "aspirationRisk"
  ],
  "metadata": {
    "estimatedDurationMinutes": 30,
    "professions": [
      "SPEECH_THERAPIST"
    ]
  }
};
