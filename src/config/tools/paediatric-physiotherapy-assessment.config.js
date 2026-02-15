export default {
  toolCode: "PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT",
  toolName: "Paediatric Physiotherapy Assessment Form",
  version: "1.0.0",
  sections: [
    {
      code: "CLINICAL_HISTORY",
      name: "Clinical History",
      items: [
        { id: "chiefComplaint", type: "TEXT" },
        { id: "historyOfPresentCondition", type: "TEXT" },
        { id: "developmentalHistory", type: "TEXT" },
        { id: "vaccinationHistory", type: "TEXT" },
        { id: "nutritionalHistory", type: "TEXT" }
      ]
    },
    {
      code: "CLINICAL_EXAM",
      name: "Clinical Examination",
      items: [
        { id: "observation", type: "TEXT" },
        {
          id: "tone",
          type: "SELECT",
          options: ["Hypotonia", "Hypertonia", "Fluctuating"]
        },
        {
          id: "primitiveReflexes",
          type: "SELECT",
          options: ["Present", "Absent", "Persistent"]
        },
        {
          id: "gmfcsLevel",
          type: "SELECT",
          options: ["I", "II", "III", "IV", "V", "NOT_APPLICABLE"]
        },
        { id: "gmfmSummary", type: "TEXT" }
      ]
    },
    {
      code: "PLAN",
      name: "Diagnosis and Plan",
      items: [
        { id: "physiotherapyDiagnosis", type: "TEXT" },
        { id: "goals", type: "TEXT" },
        { id: "treatmentPlan", type: "TEXT" },
        { id: "treatment", type: "TEXT" }
      ]
    }
  ],
  metadata: {
    estimatedDurationMinutes: 45,
    professions: ["PHYSIOTHERAPIST", "OCCUPATIONAL_THERAPIST"],
    applicableCondition: "CEREBRAL_PALSY"
  }
};
