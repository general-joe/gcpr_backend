export const otCpClinicalAssessmentSections = [
  {
    code: "HOME_ENVIRONMENT",
    name: "Family and Home Environment",
    items: [
      { id: "houseTypeAndLevel", type: "TEXT", text: "House Type and Level" },
      { id: "groundSurface", type: "TEXT", text: "Ground Surface" },
      { id: "mainEntrance", type: "TEXT", text: "Main Entrance" },
      { id: "doorHallwayAccess", type: "TEXT", text: "Door and Hallway Access" },
      { id: "stairsAndBanisters", type: "TEXT", text: "Stairs and Banisters" },
      { id: "bedroomAccess", type: "TEXT", text: "Bedroom Access" },
      { id: "accessibilityIssues", type: "TEXT", text: "Accessibility Issues" },
      { id: "equipmentInUse", type: "TEXT", text: "Equipment in Use" },
      { id: "equipmentSource", type: "TEXT", text: "Equipment Source" }
    ]
  },
  {
    code: "NEUROMOTOR",
    name: "Reflexes and Gross Motor",
    items: [
      {
        id: "primitiveAndProtectiveReflexes",
        type: "TEXT",
        text: "Primitive and Protective Reflexes"
      },
      { id: "grossMotorMilestones", type: "TEXT", text: "Gross Motor Milestones" },
      {
        id: "gmfcsLevel",
        type: "SELECT",
        text: "GMFCS Level",
        options: ["I", "II", "III", "IV", "V"]
      },
      { id: "neuromotorComments", type: "TEXT", text: "Neuromotor Comments" }
    ]
  },
  {
    code: "UPPER_EXTREMITY",
    name: "Upper Extremity Musculoskeletal",
    items: [
      {
        id: "rightUpperExtremityMmtRom",
        type: "TEXT",
        text: "Right Upper Extremity MMT/ROM"
      },
      {
        id: "leftUpperExtremityMmtRom",
        type: "TEXT",
        text: "Left Upper Extremity MMT/ROM"
      },
      {
        id: "modifiedAshworthScale",
        type: "SELECT",
        text: "Modified Ashworth Scale",
        options: ["0", "1", "1+", "2", "3", "4"]
      }
    ]
  },
  {
    code: "OCCUPATIONAL_PROFILE",
    name: "Occupational Profile and ADL",
    items: [
      { id: "occupationalProfileRoles", type: "TEXT", text: "Occupational Profile Roles" },
      { id: "adlSkills", type: "TEXT", text: "ADL Skills" },
      { id: "adlPerformanceDetails", type: "TEXT", text: "ADL Performance Details" }
    ]
  }
];

