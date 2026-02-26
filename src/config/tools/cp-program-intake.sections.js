export const cpProgramIntakeSections = [
  {
    code: "DEMOGRAPHICS",
    name: "Demographics and Contacts",
    items: [
      { id: "childFullName", type: "TEXT", text: "Child Full Name" },
      { id: "dateOfBirth", type: "DATE", text: "Date of Birth" },
      { id: "gender", type: "SELECT", text: "Gender", options: ["MALE", "FEMALE"] },
      { id: "parentGuardianName", type: "TEXT", text: "Parent/Guardian Name" },
      { id: "homePhone", type: "TEXT", text: "Home Phone" },
      { id: "workCellPhone", type: "TEXT", text: "Work/Cell Phone" },
      { id: "primaryCarePhysician", type: "TEXT", text: "Primary Care Physician" },
      { id: "otherMedicalSpecialists", type: "TEXT", text: "Other Medical Specialists" }
    ]
  },
  {
    code: "MATERNAL_BIRTH_HISTORY",
    name: "Maternal Health and Birth History",
    items: [
      {
        id: "deliveryTerm",
        type: "SELECT",
        text: "Delivery Term",
        options: ["PREMATURE", "FULL_TERM", "LATE"]
      },
      { id: "pregnancyLengthWeeks", type: "NUMBER", text: "Pregnancy Length (Weeks)" },
      { id: "birthWeight", type: "TEXT", text: "Birth Weight" },
      { id: "admittedAfterBirth", type: "BOOLEAN", text: "Admitted After Birth" },
      {
        id: "weeksInHospitalAfterBirth",
        type: "NUMBER",
        text: "Weeks in Hospital After Birth"
      },
      { id: "locationOfDelivery", type: "TEXT", text: "Location of Delivery" },
      {
        id: "deliveryMethod",
        type: "SELECT",
        text: "Delivery Method",
        options: ["VAGINAL", "C_SECTION", "BREECH", "FORCEPS", "OTHER"]
      },
      { id: "difficultLabor", type: "BOOLEAN", text: "Difficult Labor" },
      { id: "birthProblems", type: "TEXT", text: "Birth Problems" },
      { id: "maternalConditionSummary", type: "TEXT", text: "Maternal Condition Summary" },
      { id: "maternalHealthConditions", type: "TEXT", text: "Maternal Health Conditions" },
      { id: "pregnancyStressors", type: "TEXT", text: "Pregnancy Stressors" },
      {
        id: "maternalPregnancyMedications",
        type: "TEXT",
        text: "Maternal Pregnancy Medications"
      }
    ]
  },
  {
    code: "HPI_AND_SYSTEMS",
    name: "History of Present Illness and Review of Systems",
    items: [
      { id: "concernsToday", type: "TEXT", text: "Concerns Today" },
      { id: "specificConcerns", type: "TEXT", text: "Specific Concerns" },
      { id: "dietAndNutrition", type: "TEXT", text: "Diet and Nutrition" },
      { id: "mobility", type: "TEXT", text: "Mobility" },
      { id: "language", type: "TEXT", text: "Language" },
      { id: "servicesAndSchool", type: "TEXT", text: "Services and School" },
      { id: "equipment", type: "TEXT", text: "Equipment" },
      { id: "homeCareAgency", type: "TEXT", text: "Home Care Agency" },
      { id: "medications", type: "TEXT", text: "Medications" },
      { id: "allergies", type: "TEXT", text: "Allergies" },
      { id: "immunizationStatus", type: "TEXT", text: "Immunization Status" },
      { id: "reviewOfSystems", type: "TEXT", text: "Review of Systems" }
    ]
  },
  {
    code: "PFSH",
    name: "Past Medical, Family, Social History",
    items: [
      { id: "pastMedicalHistory", type: "TEXT", text: "Past Medical History" },
      { id: "pastSurgeries", type: "TEXT", text: "Past Surgeries" },
      { id: "hospitalizations", type: "TEXT", text: "Hospitalizations" },
      { id: "injuriesOrFractures", type: "TEXT", text: "Injuries or Fractures" },
      { id: "proceduresAndTests", type: "TEXT", text: "Procedures and Tests" },
      { id: "socialHistory", type: "TEXT", text: "Social History" },
      { id: "familyMedicalHistory", type: "TEXT", text: "Family Medical History" },
      { id: "finalDiagnosis", type: "TEXT", text: "Final Diagnosis" }
    ]
  }
];

