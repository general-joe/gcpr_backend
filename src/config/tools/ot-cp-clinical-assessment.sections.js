export const otCpClinicalAssessmentSections = [
  {
    code: "HOME_ENVIRONMENT",
    name: "Family and Home Environment",
    items: [
      {
        id: "houseTypeAndLevel",
        type: "TEXT",
        text: "House Type and Level"
      },
      {
        id: "groundSurface",
        type: "SELECT",
        text: "Ground Surface",
        options: [
          "Even (Concrete/asphalt)",
          "Sand",
          "Gravel",
          "Uneven"
        ]
      },
      {
        id: "mainEntrance",
        type: "SELECT",
        text: "Main Entrance",
        options: [
          "Leveled/even",
          "Few Steps",
          "Ramp",
          "Elevator"
        ]
      },
      {
        id: "doorHallwayAccess",
        type: "SELECT",
        text: "Doors / Hallways",
        options: [
          "Wheelchair Accessible",
          "Narrow"
        ]
      },
      {
        id: "stairsInsideHouse",
        type: "RADIO",
        text: "Stairs Inside House",
        options: ["Yes", "No"]
      },
      {
        id: "banisters",
        type: "RADIO",
        text: "Banisters (Railing)",
        options: ["Yes", "No", "N/A"]
      },
      {
        id: "bedroomAccess",
        type: "CHECKBOX",
        text: "Bedroom",
        options: [
          "Main Floor",
          "Higher Level",
          "Bed",
          "Mattress On Ground"
        ]
      },
      {
        id: "accessibilityIssues",
        type: "TEXTAREA",
        text: "Accessibility Issues"
      },
      {
        id: "equipmentInUse",
        type: "CHECKBOX",
        text: "Equipment In Use",
        options: [
          "Manual Wheelchair",
          "Powered Wheelchair",
          "Elbow Gaiter",
          "RT Wrist Splint",
          "LT Wrist Splint",
          "RT Hand Splint",
          "LT Hand Splint",
          "Pushchair/Stroller",
          "Feeding Chair",
          "Car Seat",
          "Toilet Chair",
          "Shower Chair",
          "Special Tables",
          "Adapted Eating Aids",
          "Other"
        ]
      },
      {
        id: "equipmentSource",
        type: "TEXTAREA",
        text: "Source Of Equipment"
      }
    ]
  },
  {
    code: "NEUROMOTOR",
    name: "Reflexes and Gross Motor",
    items: [
      {
        id: "primitiveAndProtectiveReflexes",
        type: "CHECKBOX",
        text: "Primitive and Protective Reflexes",
        options: [
          "Moro Reflex (6 Months)",
          "ATNR (4 Months)",
          "Protective Reaction – Forward (6 Months)",
          "Protective Reaction – Side (6 Months)",
          "Protective Reaction – Backward (10 Months)"
        ]
      },
      {
        id: "grossMotorMilestones",
        type: "CHECKBOX",
        text: "Gross Motor Milestones",
        options: [
          "Pull To Sit",
          "Rolling",
          "Prone",
          "Prone On Forearm",
          "Prone On Open Hands",
          "Creeping",
          "Crawling",
          "Walking",
          "Head Control",
          "Trunk Control",
          "Sitting Balance Static",
          "Sitting Balance Dynamic",
          "Standing Balance Static",
          "Standing Balance Dynamic"
        ]
      },
      {
        id: "gmfcsLevel",
        type: "RADIO",
        text: "GMFCS Level",
        options: [
          { value: "LEVEL_1", label: "Level I", score: 1 },
          { value: "LEVEL_2", label: "Level II", score: 2 },
          { value: "LEVEL_3", label: "Level III", score: 3 },
          { value: "LEVEL_4", label: "Level IV", score: 4 },
          { value: "LEVEL_5", label: "Level V", score: 5 }
        ]
      },
      {
        id: "neuromotorComments",
        type: "TEXTAREA",
        text: "Comments"
      }
    ]
  },
  {
    code: "UPPER_EXTREMITY",
    name: "Upper Extremity Musculoskeletal",
    items: [
      {
        id: "rightUpperExtremityMmtRom",
        type: "TEXTAREA",
        text: "Right Upper Extremity MMT / ROM"
      },
      {
        id: "leftUpperExtremityMmtRom",
        type: "TEXTAREA",
        text: "Left Upper Extremity MMT / ROM"
      },
      {
        id: "modifiedAshworthScale",
        type: "RADIO",
        text: "Modified Ashworth Scale",
        options: [
          { value: "MAS_0", label: "0 - No increase in muscle tone", score: 0 },
          { value: "MAS_1", label: "1 - Slight increase, catch and release", score: 1 },
          { value: "MAS_1_PLUS", label: "1+ - Slight increase, catch then minimal resistance", score: 1.5 },
          { value: "MAS_2", label: "2 - More marked increase, affected part easily moved", score: 2 },
          { value: "MAS_3", label: "3 - Considerable increase, passive movement difficult", score: 3 },
          { value: "MAS_4", label: "4 - Affected part rigid in flexion or extension", score: 4 }
        ]
      }
    ]
  },
  {
    code: "OCCUPATIONAL_PROFILE",
    name: "Occupational Profile and ADL",
    items: [
      { id: "occupationalProfileRoles", type: "TEXTAREA", text: "Occupational Profile / Roles" },
      { id: "adlSkills", type: "TEXTAREA", text: "Activities Of Daily Living Skills" },
      { id: "adlPerformanceDetails", type: "TEXTAREA", text: "Details Of ADL Performance" }
    ]
  },
  {
    code: "ADL_DETAILED",
    name: "ADL Skills Detailed",
    items: [
      { id: "selfFeeding", type: "RADIO", text: "Self Feeding", options: ["Able", "With Difficulties", "Need Adaptations", "Unable"] },
      { id: "undressingUpper", type: "RADIO", text: "Undressing - Upper Body", options: ["Able", "With Difficulties", "Need Adaptations", "Unable"] },
      { id: "undressingLower", type: "RADIO", text: "Undressing - Lower Body", options: ["Able", "With Difficulties", "Need Adaptations", "Unable"] },
      { id: "dressingUpper", type: "RADIO", text: "Dressing - Upper Body", options: ["Able", "With Difficulties", "Need Adaptations", "Unable"] },
      { id: "dressingLower", type: "RADIO", text: "Dressing - Lower Body", options: ["Able", "With Difficulties", "Need Adaptations", "Unable"] },
      { id: "grooming", type: "RADIO", text: "Grooming", options: ["Able", "With Difficulties", "Need Adaptations", "Unable"] },
      { id: "toothBrushing", type: "RADIO", text: "Tooth Brushing", options: ["Able", "With Difficulties", "Need Adaptations", "Unable"] },
      { id: "bathing", type: "RADIO", text: "Bathing", options: ["Able", "With Difficulties", "Need Adaptations", "Unable"] },
      { id: "transferTubShower", type: "RADIO", text: "Transfer - Tub/Shower", options: ["Able", "With Difficulties", "Need Adaptations", "Unable"] },
      { id: "toileting", type: "RADIO", text: "Toileting", options: ["Able", "With Difficulties", "Need Adaptations", "Unable"] },
      { id: "functionalMobility", type: "RADIO", text: "Functional Mobility", options: ["Able", "With Difficulties", "Need Adaptations", "Unable"] },
      { id: "transferBedChair", type: "RADIO", text: "Transfer - Bed, Chair, W/C", options: ["Able", "With Difficulties", "Need Adaptations", "Unable"] }
    ]
  }
];
