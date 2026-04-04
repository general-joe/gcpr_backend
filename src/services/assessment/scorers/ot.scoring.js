const ASHWORTH_DESCRIPTIONS = {
  "0": "No increase in muscle tone",
  "1": "Slight increase in tone — catch and release or minimal resistance",
  "1+": "Slight increase — catch followed by minimal resistance through less than half of ROM",
  "2": "More marked increase through most of ROM, limb easily moved",
  "3": "Considerable increase, passive movement difficult",
  "4": "Rigid in flexion or extension"
};

const GMFCS_DESCRIPTIONS = {
  I: "Walks without limitations",
  II: "Walks with limitations",
  III: "Walks using a hand-held mobility device",
  IV: "Self-mobility with limitations; may use powered mobility",
  V: "Transported in a manual wheelchair"
};

export const scoreOT = ({ responses }) => {
  const gmfcsLevel = responses.gmfcsLevel ?? null;
  const ashworth = responses.modifiedAshworthScale ?? null;

  const findings = [];
  const recommendations = [];

  if (gmfcsLevel) {
    findings.push(`GMFCS Level ${gmfcsLevel}: ${GMFCS_DESCRIPTIONS[gmfcsLevel] ?? "Unknown"}`);
  }

  if (ashworth) {
    findings.push(`Modified Ashworth Scale: ${ashworth} — ${ASHWORTH_DESCRIPTIONS[ashworth] ?? "Unknown"}`);
    const grade = ashworth === "1+" ? 1.5 : Number(ashworth);
    if (grade >= 2) {
      recommendations.push(
        "Elevated spasticity detected. Consider positioning programme, " +
        "splinting, and consultation with rehabilitation paediatrician for pharmacological management."
      );
    }
  }

  if (responses.accessibilityIssues) {
    findings.push(`Accessibility issues: ${responses.accessibilityIssues}`);
    recommendations.push("Environmental modification assessment recommended.");
  }

  if (responses.adlPerformanceDetails) {
    findings.push(`ADL performance: ${responses.adlPerformanceDetails}`);
  }

  if (recommendations.length === 0) {
    recommendations.push("Continue current OT programme. Reassess at next scheduled visit.");
  }

  const summary = findings.length > 0
    ? `OT clinical assessment completed. ${findings.join(". ")}.`
    : "OT clinical assessment completed. No structured findings extracted.";

  return {
    scores: {
      gmfcsLevel,
      modifiedAshworthScale: ashworth,
      equipmentInUse: responses.equipmentInUse ?? null
    },
    summary,
    interpretation: ashworth
      ? `Modified Ashworth Scale grade ${ashworth}: ${ASHWORTH_DESCRIPTIONS[ashworth] ?? "see clinical notes"}.`
      : "Modified Ashworth Scale not assessed.",
    recommendations
  };
};
