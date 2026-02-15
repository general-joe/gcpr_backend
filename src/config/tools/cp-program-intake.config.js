export default {
  toolCode: "CP_PROGRAM_INTAKE",
  toolName: "Cerebral Palsy Program Intake Form",
  version: "1.0.0",
  sections: [
    {
      code: "DEMOGRAPHICS",
      name: "Demographics and Contacts",
      items: [
        { id: "childFullName", type: "TEXT" },
        { id: "dateOfBirth", type: "DATE" },
        { id: "gender", type: "SELECT", options: ["MALE", "FEMALE"] },
        { id: "parentGuardianName", type: "TEXT" },
        { id: "homePhone", type: "TEXT" },
        { id: "workCellPhone", type: "TEXT" },
        { id: "primaryCarePhysician", type: "TEXT" },
        { id: "otherMedicalSpecialists", type: "TEXT" }
      ]
    },
    {
      code: "MATERNAL_BIRTH_HISTORY",
      name: "Maternal Health and Birth History",
      items: [
        {
          id: "deliveryTerm",
          type: "SELECT",
          options: ["PREMATURE", "FULL_TERM", "LATE"]
        },
        { id: "pregnancyLengthWeeks", type: "NUMBER" },
        { id: "birthWeight", type: "TEXT" },
        { id: "admittedAfterBirth", type: "BOOLEAN" },
        { id: "weeksInHospitalAfterBirth", type: "NUMBER" },
        { id: "locationOfDelivery", type: "TEXT" },
        {
          id: "deliveryMethod",
          type: "SELECT",
          options: ["VAGINAL", "C_SECTION", "BREECH", "FORCEPS", "OTHER"]
        },
        { id: "difficultLabor", type: "BOOLEAN" },
        { id: "birthProblems", type: "TEXT" },
        { id: "maternalConditionSummary", type: "TEXT" },
        { id: "maternalHealthConditions", type: "TEXT" },
        { id: "pregnancyStressors", type: "TEXT" },
        { id: "maternalPregnancyMedications", type: "TEXT" }
      ]
    },
    {
      code: "HPI_AND_SYSTEMS",
      name: "History of Present Illness and Review of Systems",
      items: [
        { id: "concernsToday", type: "TEXT" },
        { id: "specificConcerns", type: "TEXT" },
        { id: "dietAndNutrition", type: "TEXT" },
        { id: "mobility", type: "TEXT" },
        { id: "language", type: "TEXT" },
        { id: "servicesAndSchool", type: "TEXT" },
        { id: "equipment", type: "TEXT" },
        { id: "homeCareAgency", type: "TEXT" },
        { id: "medications", type: "TEXT" },
        { id: "allergies", type: "TEXT" },
        { id: "immunizationStatus", type: "TEXT" },
        { id: "reviewOfSystems", type: "TEXT" }
      ]
    },
    {
      code: "PFSH",
      name: "Past Medical, Family, Social History",
      items: [
        { id: "pastMedicalHistory", type: "TEXT" },
        { id: "pastSurgeries", type: "TEXT" },
        { id: "hospitalizations", type: "TEXT" },
        { id: "injuriesOrFractures", type: "TEXT" },
        { id: "proceduresAndTests", type: "TEXT" },
        { id: "socialHistory", type: "TEXT" },
        { id: "familyMedicalHistory", type: "TEXT" },
        { id: "finalDiagnosis", type: "TEXT" }
      ]
    }
  ],
  metadata: {
    estimatedDurationMinutes: 35,
    professions: [
      "GENERAL_PAEDIATRICIAN",
      "DEVELOPMENTAL_PAEDIATRICIAN",
      "PAEDIATRIC_NEUROLOGIST",
      "NEURODEVELOPMENTAL_PAEDIATRICIAN",
      "REHABILITATION_PAEDIATRICIAN"
    ],
    intakeOnly: true
  }
};
