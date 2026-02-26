import { paediatricPhysiotherapyAssessmentSections } from "./paediatric-physiotherapy-assessment.sections.js";

export default {
  toolCode: "PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT",
  toolName: "Paediatric Physiotherapy Assessment Form",
  version: "1.0.0",
  sections: paediatricPhysiotherapyAssessmentSections,
  metadata: {
    estimatedDurationMinutes: 45,
    professions: ["PHYSIOTHERAPIST", "OCCUPATIONAL_THERAPIST"],
    applicableCondition: "CEREBRAL_PALSY"
  }
};
