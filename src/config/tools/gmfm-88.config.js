import { gmfm88Items } from "./gmfm-88.items.js";

const dimensions = [
  {
    code: "A",
    name: "Lying and Rolling",
    itemRange: [1, 17],
    maxScore: 51
  },
  {
    code: "B",
    name: "Sitting",
    itemRange: [18, 37],
    maxScore: 60
  },
  {
    code: "C",
    name: "Crawling and Kneeling",
    itemRange: [38, 51],
    maxScore: 42
  },
  {
    code: "D",
    name: "Standing",
    itemRange: [52, 64],
    maxScore: 39
  },
  {
    code: "E",
    name: "Walking, Running and Jumping",
    itemRange: [65, 88],
    maxScore: 72
  }
];

export default {
  toolCode: "GMFM_88",
  toolName: "Gross Motor Function Measure (GMFM-88)",
  version: "1.0.0",
  scoringKey: {
    0: "Does not initiate",
    1: "Initiates",
    2: "Partially completes",
    3: "Completes",
    NT: "Not tested"
  },
  dimensions,
  items: gmfm88Items,
  calculations: {
    dimensionPercentage: "dimensionScore / maxScore * 100",
    totalScore: "average(dimensionsPercentages)"
  },
  gmfm66: {
    supported: true,
    calculation: "EXTERNAL_GMAE",
    note: "GMFM-66 score must be entered manually from GMAE-3"
  },
  metadata: {
    applicableCondition: "CEREBRAL_PALSY",
    professions: ["PHYSIOTHERAPIST", "OCCUPATIONAL_THERAPIST"],
    testConditionsRequired: ["No shoes", "No orthoses", "No assistive devices"],
    estimatedDurationMinutes: 45
  }
};
