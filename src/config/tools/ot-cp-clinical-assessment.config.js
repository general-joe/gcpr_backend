import { otCpClinicalAssessmentSections } from "./ot-cp-clinical-assessment.sections.js";

export default {
  toolCode: "OT_CP_CLINICAL_ASSESSMENT",
  toolName: "Occupational Therapist Assessment Clinical Section",
  version: "1.0.0",
  sections: otCpClinicalAssessmentSections,
  metadata: {
    estimatedDurationMinutes: 45,
    professions: ["OCCUPATIONAL_THERAPIST", "PHYSIOTHERAPIST"],
    applicableCondition: "CEREBRAL_PALSY"
  }
};
