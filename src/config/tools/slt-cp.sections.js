export const sltCpBaselineSections = [
  {
    code: "CASE_HISTORY",
    name: "Case History",
    items: [
      { id: "diagnosis", type: "TEXT", text: "Diagnosis" },
      { id: "gestationalHistory", type: "TEXT", text: "Gestational History" },
      { id: "developmentalHistory", type: "TEXT", text: "Developmental History" },
      { id: "primaryCaregiverConcerns", type: "TEXT", text: "Primary Caregiver Concerns" },
      { id: "languagesSpokenAtHome", type: "TEXT", text: "Languages Spoken at Home" }
    ]
  },
  {
    code: "ORAL_MOTOR",
    name: "Oral Motor / Speech Mechanism",
    items: [
      { id: "jaw", type: "SELECT", text: "Jaw", options: ["Adequate", "Weak", "Limited", "Involuntary"] },
      { id: "tongue", type: "SELECT", text: "Tongue", options: ["Adequate", "Reduced", "Poor", "Tremors"] },
      { id: "lips", type: "SELECT", text: "Lips", options: ["Adequate", "Reduced", "Poor seal", "Drooling"] },
      { id: "voice", type: "SELECT", text: "Voice", options: ["Clear", "Strained", "Breathy", "Hoarse"] }
    ]
  },
  {
    code: "LANGUAGE_SKILLS",
    name: "Speech & Language Skills",
    items: [
      {
        id: "receptiveLanguage",
        type: "SELECT",
        text: "Receptive Language",
        options: ["1-step", "2-step", "Vocabulary", "Abstract"]
      },
      {
        id: "expressiveLanguage",
        type: "SELECT",
        text: "Expressive Language",
        options: ["Vocalizations", "Single words", "Phrases", "Sentences", "Narratives", "AAC"]
      },
      {
        id: "speechClarity",
        type: "SELECT",
        text: "Speech Clarity",
        options: ["Clear", "Mild", "Moderate", "Severe"]
      },
      { id: "fluency", type: "SELECT", text: "Fluency", options: ["Normal", "Stuttering", "Cluttering"] }
    ]
  },
  {
    code: "ACTIVITY_PARTICIPATION",
    name: "Activity & Participation",
    items: [
      { id: "initiatesCommunication", type: "BOOLEAN", text: "Initiates Communication" },
      { id: "maintainsTopic", type: "BOOLEAN", text: "Maintains Topic" },
      { id: "turnTaking", type: "BOOLEAN", text: "Turn Taking" },
      { id: "usesGestures", type: "BOOLEAN", text: "Uses Gestures" },
      { id: "participationNotes", type: "TEXT", text: "Participation Notes" }
    ]
  }
];

