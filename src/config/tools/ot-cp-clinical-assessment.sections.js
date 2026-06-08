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
          { value: "LEVELLED_EVEN", label: "Leveled/even" },
          { value: "FEW_STEPS", label: "Few Steps" },
          { value: "RAMP", label: "Ramp" },
          { value: "ELEVATOR", label: "Elevator" }
        ]
      },
      {
        id: "doorHallwayAccess",
        type: "SELECT",
        text: "Doors / Hallways",
        options: [
          { value: "WHEELCHAIR_ACCESSIBLE", label: "Wheelchair accessible" },
          { value: "NARROW", label: "Narrow" }
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
  },
  {
    code: "SENSORIMOTOR",
    name: "Sensorimotor Skills",
    items: [
      { id: "sensationProprioception", type: "TEXT", text: "Proprioception (R / L)" },
      { id: "sensationDeepPressure", type: "TEXT", text: "Deep Pressure (R / L)" },
      { id: "sensationSharpDull", type: "TEXT", text: "Sharp / Dull (R / L)" },
      { id: "sensationLightTouch", type: "TEXT", text: "Light Touch (R / L)" },
      { id: "sensationStereognosis", type: "TEXT", text: "Stereognosis (R / L)" },
      { id: "sensorimotorComments", type: "TEXTAREA", text: "Comments" }
    ]
  },
  {
    code: "FINE_MOTOR",
    name: "Fine Motor / Hand Function",
    items: [
      { id: "dominance", type: "RADIO", text: "Dominance", options: ["R", "L", "Ambidextrous", "Not Established"] },
      { id: "powerGripRight", type: "TEXT", text: "Power Grip (R)" },
      { id: "lateralGripRight", type: "TEXT", text: "Lateral Grip (R)" },
      { id: "pinchGripRight", type: "TEXT", text: "Pinch Grip (R)" },
      { id: "oppositionRight", type: "TEXT", text: "Opposition (R)" },
      { id: "fineMotorRight", type: "TEXT", text: "Fine Motor / Functional Use (R)" },
      { id: "powerGripLeft", type: "TEXT", text: "Power Grip (L)" },
      { id: "lateralGripLeft", type: "TEXT", text: "Lateral Grip (L)" },
      { id: "pinchGripLeft", type: "TEXT", text: "Pinch Grip (L)" },
      { id: "oppositionLeft", type: "TEXT", text: "Opposition (L)" },
      { id: "fineMotorLeft", type: "TEXT", text: "Fine Motor / Functional Use (L)" },
      { id: "preWritingPenPaperConcept", type: "TEXT", text: "Pre / Writing Skills - Pen-paper concept" },
      { id: "preWritingFluency", type: "TEXT", text: "Fluency" },
      { id: "penGrasp", type: "TEXT", text: "Pen Grasp" },
      { id: "preWritingControl", type: "TEXT", text: "Control" },
      { id: "computerTabletSkills", type: "CHECKBOX", text: "Computer / Tablet Skills", options: ["Able", "Unable", "With Difficulties", "Need Adaptations"] },
      { id: "scissorsSkills", type: "CHECKBOX", text: "Pre / Scissors Skills", options: ["Able", "Unable", "With Difficulties", "Need Adaptations"] },
      { id: "bimanualFineMotorScale", type: "RADIO", text: "Bimanual Fine Motor Functions scale", options: ["Level I", "Level II", "Level III", "Level IV", "Level V"] },
      { id: "fineMotorComments", type: "TEXTAREA", text: "Comments" }
    ]
  },
  {
    code: "SENSORY_BEHAVIOR",
    name: "Sensory, Behavior, Cognitive & Perceptual Skills",
    items: [
      { id: "visualAcuity", type: "CHECKBOX", text: "Visual Acuity", options: ["Normal", "Visual Field Deficit"] },
      { id: "visualTracking", type: "CHECKBOX", text: "Visual Tracking / Wears Eye Glasses", options: ["Wears Eye Glasses"] },
      { id: "hearing", type: "CHECKBOX", text: "Hearing / Wears Hearing Aid", options: ["Wears Hearing Aid"] },
      { id: "communicationExpressive", type: "CHECKBOX", text: "Communication - Expressive" , options: ["Yes"]},
      { id: "communicationReceptive", type: "CHECKBOX", text: "Communication - Receptive" , options: ["Yes"]},
      { id: "communicationNonVerbal", type: "CHECKBOX", text: "Communication - Non verbal", options: ["Yes"] },
      { id: "playLevel", type: "CHECKBOX", text: "Play Level", options: ["Solo", "Parallel", "Interactive", "Exploratory", "Symbolic", "Constructive"] },
      { id: "behavioralObservations", type: "CHECKBOX", text: "Behavioral Observations / Response To Play", options: [
        "Unresponsive",
        "Passive",
        "Under aroused",
        "Makes/Holds Eye contact",
        "Stranger aware",
        "Autistic-like behaviour",
        "Stereotyped Movements",
        "Self-harming",
        "Shy",
        "Cry Baby",
        "Irritable",
        "Temper Tantrums",
        "Distractible",
        "Hyperactive",
        "Low Frustration Tolerance",
        "Playful",
        "Cooperative"
      ] },
      { id: "sensoryBehaviorComments", type: "TEXTAREA", text: "Comments" }
    ]
  },
  {
    code: "SUMMARY_PROBLEMS",
    name: "Summary of Patient Problems",
    items: [
      { id: "summaryProblems", type: "CHECKBOX", text: "Summary of Patient Problems", options: [
        "Abnormal posture/movement pattern",
        "↓ Sitting Balance",
        "↓ Functional mobility",
        "↓ Functional activity: ADL",
        "↓ Functional activity: Leisure",
        "↓ Functional School Activities",
        "Abnormal UE Tone",
        "↓ Upper Extremity ROM",
        "↓ Upper Extremity Strength",
        "Upper Extremity Contracture",
        "Fine Motor / Coordination",
        "↓ Cognition",
        "↓ Visual Perception",
        "Impaired Sensory Processing / Modulation",
        "↓ Upper Extremity Sensation"
      ] },
      { id: "significantFindings", type: "TEXTAREA", text: "Significant Findings" },
      { id: "summaryComments", type: "TEXTAREA", text: "Comments" }
    ]
  }
];
