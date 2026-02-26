export const paediatricPhysiotherapyAssessmentSections = [
  {
    code: "CLINICAL_HISTORY",
    name: "Clinical History",
    items: [
      { id: "chiefComplaint", type: "TEXT", text: "Chief Complaint" },
      { id: "historyOfPresentCondition", type: "TEXT", text: "History of Present Condition" },
      { id: "developmentalHistory", type: "TEXT", text: "Developmental History" },
      { id: "vaccinationHistory", type: "TEXT", text: "Vaccination History" },
      { id: "nutritionalHistory", type: "TEXT", text: "Nutritional History" }
    ]
  },
  {
    code: "CLINICAL_EXAM",
    name: "Clinical Examination",
    items: [
      { id: "observation", type: "TEXT", text: "Observation" },
      {
        id: "tone",
        type: "SELECT",
        text: "Tone",
        options: ["Hypotonia", "Hypertonia", "Fluctuating"]
      },
      {
        id: "primitiveReflexes",
        type: "SELECT",
        text: "Primitive Reflexes",
        options: ["Present", "Absent", "Persistent"]
      },
      {
        id: "gmfcsLevel",
        type: "SELECT",
        text: "GMFCS Level",
        options: ["I", "II", "III", "IV", "V", "NOT_APPLICABLE"]
      },
      { id: "gmfmSummary", type: "TEXT", text: "GMFM Summary" }
    ]
  },
  {
    code: "PLAN",
    name: "Diagnosis and Plan",
    items: [
      { id: "physiotherapyDiagnosis", type: "TEXT", text: "Physiotherapy Diagnosis" },
      { id: "treatmentPlan", type: "TEXT", text: "Treatment Plan" },
      { id: "treatment", type: "TEXT", text: "Treatment" }
    ]
  }
];
