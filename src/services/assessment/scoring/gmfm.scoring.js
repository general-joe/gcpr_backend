export function scoreGMFM88(responses, config) {
  const dimensionTotals = {};
  const dimensionPercentages = {};

  for (const dim of config.dimensions) {
    const scores = Object.entries(responses)
      .filter(([key]) => key.startsWith(dim.code))
      .map(([, value]) => (value === "NT" ? 0 : value));

    const total = scores.reduce((a, b) => a + b, 0);
    dimensionTotals[dim.code] = total;
    dimensionPercentages[dim.code] = (total / dim.maxScore) * 100;
  }

  const totalScore =
    Object.values(dimensionPercentages).reduce((a, b) => a + b, 0) /
    config.dimensions.length;

  return {
    dimensionTotals,
    dimensionPercentages,
    totalScore
  };
}
