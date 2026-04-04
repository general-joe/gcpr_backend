const GMFCS_DESCRIPTIONS = {
  I: "Walks without limitations",
  II: "Walks with limitations",
  III: "Walks using a hand-held mobility device",
  IV: "Self-mobility with limitations; may use powered mobility",
  V: "Transported in a manual wheelchair",
  NOT_APPLICABLE: "Not applicable"
};

const TONE_GUIDANCE = {
  Hypotonia: "Consider strengthening, postural control, and proprioceptive activities.",
  Hypertonia: "Prioritize stretching, positioning, and spasticity management strategies.",
  Fluctuating: "Focus on stability, proximal control, and graded movement training."
};

export const scorePhysiotherapy = ({ responses }) => {
  const gmfcsLevel = responses.gmfcsLevel ?? null;
  const tone = responses.tone ?? null;
  const reflexes = responses.primitiveReflexes ?? null;

  const findings = [];
  const recommendations = [];

  if (gmfcsLevel && gmfcsLevel !== "NOT_APPLICABLE") {
    findings.push(`GMFCS Level ${gmfcsLevel}: ${GMFCS_DESCRIPTIONS[gmfcsLevel] ?? "Unknown"}`);
  }

  if (tone) {
    findings.push(`Tone: ${tone}`);
    const guidance = TONE_GUIDANCE[tone];
    if (guidance) recommendations.push(guidance);
  }

  if (reflexes) {
    findings.push(`Primitive reflexes: ${reflexes}`);
    if (reflexes === "Persistent") {
      recommendations.push(
        "Persistent primitive reflexes may indicate delayed neuromotor maturation. " +
        "Reflex-inhibiting postures and developmental facilitation should be incorporated."
      );
    }
  }

  if (responses.treatmentPlan) {
    recommendations.push(responses.treatmentPlan);
  }

  const summary = findings.length > 0
    ? `Paediatric physiotherapy assessment completed. ${findings.join(". ")}.`
    : "Paediatric physiotherapy assessment completed. No structured findings extracted.";

  return {
    scores: {
      gmfcsLevel,
      tone,
      primitiveReflexes: reflexes,
      diagnosis: responses.physiotherapyDiagnosis ?? null
    },
    summary,
    interpretation: gmfcsLevel
      ? `Patient classified at GMFCS Level ${gmfcsLevel}. ${GMFCS_DESCRIPTIONS[gmfcsLevel] ?? ""}`
      : "GMFCS level not assessed.",
    recommendations
  };
};
