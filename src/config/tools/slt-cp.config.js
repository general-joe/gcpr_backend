export default {
  "toolCode": "SLT_CP_BASELINE",
  "toolName": "Speech and Language Therapy Assessment – Cerebral Palsy",
  "version": "1.0.0",
  "sections": [
    {
      "code": "CASE_HISTORY",
      "name": "Case History",
      "items": [
        { "id": "diagnosis", "type": "TEXT" },
        { "id": "gestationalHistory", "type": "TEXT" },
        { "id": "developmentalHistory", "type": "TEXT" },
        { "id": "primaryCaregiverConcerns", "type": "TEXT" },
        { "id": "languagesSpokenAtHome", "type": "TEXT" }
      ]
    },
    {
      "code": "ORAL_MOTOR",
      "name": "Oral Motor / Speech Mechanism",
      "items": [
        { "id": "jaw", "type": "SELECT", "options": ["Adequate", "Weak", "Limited", "Involuntary"] },
        { "id": "tongue", "type": "SELECT", "options": ["Adequate", "Reduced", "Poor", "Tremors"] },
        { "id": "lips", "type": "SELECT", "options": ["Adequate", "Reduced", "Poor seal", "Drooling"] },
        { "id": "voice", "type": "SELECT", "options": ["Clear", "Strained", "Breathy", "Hoarse"] }
      ]
    },
    {
      "code": "LANGUAGE_SKILLS",
      "name": "Speech & Language Skills",
      "items": [
        { "id": "receptiveLanguage", "type": "SELECT", "options": ["1-step", "2-step", "Vocabulary", "Abstract"] },
        { "id": "expressiveLanguage", "type": "SELECT", "options": ["Vocalizations", "Single words", "Phrases", "Sentences", "Narratives", "AAC"] },
        { "id": "speechClarity", "type": "SELECT", "options": ["Clear", "Mild", "Moderate", "Severe"] },
        { "id": "fluency", "type": "SELECT", "options": ["Normal", "Stuttering", "Cluttering"] }
      ]
    },
    {
      "code": "ACTIVITY_PARTICIPATION",
      "name": "Activity & Participation",
      "items": [
        { "id": "initiatesCommunication", "type": "BOOLEAN" },
        { "id": "maintainsTopic", "type": "BOOLEAN" },
        { "id": "turnTaking", "type": "BOOLEAN" },
        { "id": "usesGestures", "type": "BOOLEAN" },
        { "id": "participationNotes", "type": "TEXT" }
      ]
    }
  ],
  "referralTriggers": [
    "feedingDifficulty",
    "severeSpeechClarity",
    "aspirationRisk"
  ],
  "metadata": {
    "estimatedDurationMinutes": 30,
    "profession": "SPEECH_THERAPIST"
  }
}
