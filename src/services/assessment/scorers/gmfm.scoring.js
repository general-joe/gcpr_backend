export const scoreGMFM88 = ({ responses, config }) => {
  const dimensionTotals = {};
  const dimensionPercentages = {};

  config.dimensions.forEach(({ code, itemRange, maxScore }) => {
    let total = 0;

    for (let i = itemRange[0]; i <= itemRange[1]; i++) {
      const key = `${code}${i}`;
      const value = responses[key];

      if (value !== "NT" && value !== undefined) {
        total += Number(value);
      }
    }

    dimensionTotals[code] = total;
    dimensionPercentages[code] = Number(
      ((total / maxScore) * 100).toFixed(2)
    );
  });

  const totalScore =
    Object.values(dimensionPercentages).reduce((a, b) => a + b, 0) /
    config.dimensions.length;

  return {
    dimensions: dimensionTotals,
    percentages: dimensionPercentages,
    totalScore: Number(totalScore.toFixed(2)),
    gmfm66: config.gmfm66
  };
};
