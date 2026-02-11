const classifyPercent = (percent) => {
  if (percent >= 85) return "Near-complete function";
  if (percent >= 70) return "Mild limitation";
  if (percent >= 50) return "Moderate limitation";
  if (percent >= 30) return "Marked limitation";
  return "Severe limitation";
};

const DIMENSION_GUIDANCE = {
  A: "Maintain bed mobility and rolling transitions with caregiver training.",
  B: "Prioritize trunk control, static/dynamic sitting balance, and protective reactions.",
  C: "Target floor mobility, quadruped control, and transition sequencing.",
  D: "Emphasize supported-to-independent standing endurance and alignment.",
  E: "Advance gait, turning, stair negotiation, running/jumping as appropriate."
};

export const scoreGMFM88 = ({ responses, config }) => {
  const dimensions = {};
  const percentages = {};
  const dimensionProfiles = {};

  config.dimensions.forEach(({ code, name, itemRange, maxScore }) => {
    let total = 0;
    let testedItems = 0;
    let notTestedItems = 0;

    for (let i = itemRange[0]; i <= itemRange[1]; i++) {
      const key = `${code}${i}`;
      const value = responses[key];

      if (value === "NT") {
        notTestedItems += 1;
        continue;
      }

      if (value !== undefined) {
        total += Number(value);
        testedItems += 1;
      }
    }

    const adjustedMaxScore = testedItems * 3;
    const percentage =
      adjustedMaxScore > 0 ? Number(((total / adjustedMaxScore) * 100).toFixed(2)) : 0;

    dimensions[code] = total;
    percentages[code] = percentage;
    dimensionProfiles[code] = {
      name,
      rawScore: total,
      maxScore,
      adjustedMaxScore,
      testedItems,
      notTestedItems,
      percentage,
      clinicalBand: classifyPercent(percentage)
    };
  });

  const totalScore =
    Object.values(percentages).reduce((a, b) => a + b, 0) / config.dimensions.length;

  const sortedProfiles = Object.entries(dimensionProfiles).sort(
    (a, b) => a[1].percentage - b[1].percentage
  );
  const weakest = sortedProfiles[0];
  const strongest = sortedProfiles[sortedProfiles.length - 1];

  const summary = `GMFM-88 total score ${Number(totalScore.toFixed(2))}%. Best domain: ${strongest[0]} (${strongest[1].percentage}%). Most limited domain: ${weakest[0]} (${weakest[1].percentage}%).`;

  const interpretation = `Gross motor function profile shows ${classifyPercent(
    totalScore
  ).toLowerCase()} overall, with relative strengths in ${
    strongest[1].name
  } and greatest activity limitation in ${
    weakest[1].name
  }. Interpret with full neurological exam, GMFCS level, and therapy context.`;

  const recommendations = sortedProfiles
    .slice(0, 2)
    .map(([code]) => DIMENSION_GUIDANCE[code])
    .concat([
      "Repeat GMFM-88 at consistent intervals (e.g., every 12-16 weeks) to track change over time.",
      "If GMFM-66 is required for outcomes reporting, compute it externally using GMAE-3."
    ]);

  return {
    scores: {
      dimensions,
      percentages,
      dimensionProfiles,
      totalScore: Number(totalScore.toFixed(2)),
      overallClinicalBand: classifyPercent(totalScore),
      gmfm66: config.gmfm66
    },
    summary,
    interpretation,
    recommendations
  };
};
