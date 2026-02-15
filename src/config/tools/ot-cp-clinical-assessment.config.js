export default {
  toolCode: "OT_CP_CLINICAL_ASSESSMENT",
  toolName: "Occupational Therapist Assessment Clinical Section",
  version: "1.0.0",
  sections: [
    {
      code: "HOME_ENVIRONMENT",
      name: "Family and Home Environment",
      items: [
        { id: "houseTypeAndLevel", type: "TEXT" },
        { id: "groundSurface", type: "TEXT" },
        { id: "mainEntrance", type: "TEXT" },
        { id: "doorHallwayAccess", type: "TEXT" },
        { id: "stairsAndBanisters", type: "TEXT" },
        { id: "bedroomAccess", type: "TEXT" },
        { id: "accessibilityIssues", type: "TEXT" },
        { id: "equipmentInUse", type: "TEXT" },
        { id: "equipmentSource", type: "TEXT" }
      ]
    },
    {
      code: "NEUROMOTOR",
      name: "Reflexes and Gross Motor",
      items: [
        { id: "primitiveAndProtectiveReflexes", type: "TEXT" },
        { id: "grossMotorMilestones", type: "TEXT" },
        {
          id: "gmfcsLevel",
          type: "SELECT",
          options: ["I", "II", "III", "IV", "V"]
        },
        { id: "neuromotorComments", type: "TEXT" }
      ]
    },
    {
      code: "UPPER_EXTREMITY",
      name: "Upper Extremity Musculoskeletal",
      items: [
        { id: "rightUpperExtremityMmtRom", type: "TEXT" },
        { id: "leftUpperExtremityMmtRom", type: "TEXT" },
        {
          id: "modifiedAshworthScale",
          type: "SELECT",
          options: ["0", "1", "1+", "2", "3", "4"]
        }
      ]
    },
    {
      code: "OCCUPATIONAL_PROFILE",
      name: "Occupational Profile and ADL",
      items: [
        { id: "occupationalProfileRoles", type: "TEXT" },
        { id: "adlSkills", type: "TEXT" },
        { id: "adlPerformanceDetails", type: "TEXT" }
      ]
    }
  ],
  metadata: {
    estimatedDurationMinutes: 45,
    professions: ["OCCUPATIONAL_THERAPIST", "PHYSIOTHERAPIST"],
    applicableCondition: "CEREBRAL_PALSY"
  }
};
