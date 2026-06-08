const ASHWORTH_SCORES = {
  MAS_0: {
    score: 0,
    label: "0",
    description: "No increase in muscle tone"
  },

  MAS_1: {
    score: 1,
    label: "1",
    description:
      "Slight increase in tone — catch and release or minimal resistance"
  },

  MAS_1_PLUS: {
    score: 1.5,
    label: "1+",
    description:
      "Slight increase — catch followed by minimal resistance through less than half of ROM"
  },

  MAS_2: {
    score: 2,
    label: "2",
    description:
      "More marked increase through most of ROM, limb easily moved"
  },

  MAS_3: {
    score: 3,
    label: "3",
    description:
      "Considerable increase, passive movement difficult"
  },

  MAS_4: {
    score: 4,
    label: "4",
    description:
      "Rigid in flexion or extension"
  }
};

const GMFCS_SCORES = {
  LEVEL_1: {
    score: 1,
    label: "Level I",
    description: "Walks without limitations"
  },

  LEVEL_2: {
    score: 2,
    label: "Level II",
    description: "Walks with limitations"
  },

  LEVEL_3: {
    score: 3,
    label: "Level III",
    description:
      "Walks using a hand-held mobility device"
  },

  LEVEL_4: {
    score: 4,
    label: "Level IV",
    description:
      "Self-mobility with limitations; may use powered mobility"
  },

  LEVEL_5: {
    score: 5,
    label: "Level V",
    description:
      "Transported in a manual wheelchair"
  }
};

const ADL_DEPENDENCY_VALUES = {
  ABLE: 0,
  WITH_DIFFICULTIES: 1,
  NEED_ADAPTATIONS: 2,
  UNABLE: 3
};
export const scoreOT = ({ responses }) => {
  const findings = [];
  const recommendations = [];

  const gmfcs = responses.gmfcsLevel
    ? GMFCS_SCORES[responses.gmfcsLevel]
    : null;

  const ashworth = responses.modifiedAshworthScale
    ? ASHWORTH_SCORES[responses.modifiedAshworthScale]
    : null;

  if (gmfcs) {
    findings.push(
      `${gmfcs.label}: ${gmfcs.description}`
    );
  }

  if (ashworth) {
    findings.push(
      `Modified Ashworth Scale ${ashworth.label}: ${ashworth.description}`
    );
  }

  if (responses.accessibilityIssues?.trim()) {
    findings.push(
      `Accessibility issues identified: ${responses.accessibilityIssues}`
    );

    recommendations.push(
      "Environmental modification assessment recommended."
    );
  }

  if (
    Array.isArray(responses.equipmentInUse) &&
    responses.equipmentInUse.length > 0
  ) {
    findings.push(
      `Equipment in use: ${responses.equipmentInUse.join(
        ", "
      )}`
    );
  }

  const adlFields = [
    "selfFeeding",
    "undressingUpper",
    "undressingLower",
    "dressingUpper",
    "dressingLower",
    "grooming",
    "toothBrushing",
    "bathing",
    "transferTubShower",
    "toileting",
    "functionalMobility",
    "transferBedChair"
  ];

  let totalAdlScore = 0;
  let assessedAdls = 0;

  adlFields.forEach(field => {
    const value = responses[field];

    if (
      value &&
      Object.prototype.hasOwnProperty.call(
        ADL_DEPENDENCY_VALUES,
        value
      )
    ) {
      totalAdlScore +=
        ADL_DEPENDENCY_VALUES[value];

      assessedAdls++;
    }
  });

  const adlAverageScore =
    assessedAdls > 0
      ? Number(
          (totalAdlScore / assessedAdls).toFixed(2)
        )
      : null;

  if (adlAverageScore !== null) {
    if (adlAverageScore >= 2.5) {
      findings.push(
        "Severe dependence in ADL performance."
      );

      recommendations.push(
        "Recommend caregiver training, adaptive equipment review, and intensive occupational therapy intervention."
      );
    } else if (adlAverageScore >= 1.5) {
      findings.push(
        "Moderate ADL limitations observed."
      );

      recommendations.push(
        "Recommend targeted occupational therapy focusing on functional independence."
      );
    } else if (adlAverageScore >= 0.5) {
      findings.push(
        "Mild ADL difficulties observed."
      );

      recommendations.push(
        "Continue therapy and reinforce home exercise programme."
      );
    } else {
      findings.push(
        "ADL performance largely independent."
      );
    }
  }

  if (gmfcs?.score >= 4) {
    recommendations.push(
      "Consider powered mobility assessment and long-term seating and positioning review."
    );
  }

  if (ashworth?.score >= 2) {
    recommendations.push(
      "Elevated spasticity detected. Consider splinting, positioning programme, stretching protocol, and rehabilitation physician review."
    );
  }

  if (
    responses.stairsInsideHouse === "Yes" &&
    gmfcs?.score >= 3
  ) {
    recommendations.push(
      "Review home accessibility and stair safety due to mobility limitations."
    );
  }

  if (
    responses.bedroomAccess?.includes(
      "Higher Level"
    ) &&
    gmfcs?.score >= 3
  ) {
    recommendations.push(
      "Consider relocating sleeping area to the main floor."
    );
  }

  if (responses.adlPerformanceDetails?.trim()) {
    findings.push(
      `ADL Notes: ${responses.adlPerformanceDetails}`
    );
  }

  if (responses.neuromotorComments?.trim()) {
    findings.push(
      `Neuromotor Notes: ${responses.neuromotorComments}`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Continue current occupational therapy programme and reassess at follow-up."
    );
  }

  return {
    scores: {
      gmfcsLevel:
        responses.gmfcsLevel ?? null,

      gmfcsScore:
        gmfcs?.score ?? null,

      modifiedAshworthScale:
        responses.modifiedAshworthScale ??
        null,

      modifiedAshworthScore:
        ashworth?.score ?? null,

      adlAverageScore,

      totalAdlScore,

      assessedAdls,

      equipmentInUse:
        responses.equipmentInUse ?? []
    },

    summary:
      findings.length > 0
        ? `Occupational therapy assessment completed. ${findings.join(
            ". "
          )}.`
        : "Occupational therapy assessment completed. No significant structured findings identified.",

    interpretation: [
      gmfcs
        ? `${gmfcs.label}: ${gmfcs.description}`
        : null,

      ashworth
        ? `Modified Ashworth Scale ${ashworth.label}: ${ashworth.description}`
        : null
    ]
      .filter(Boolean)
      .join(" | "),

    findings,

    recommendations
  };
};