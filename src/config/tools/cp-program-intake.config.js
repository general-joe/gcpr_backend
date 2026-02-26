import { cpProgramIntakeSections } from "./cp-program-intake.sections.js";

export default {
  toolCode: "CP_PROGRAM_INTAKE",
  toolName: "Cerebral Palsy Program Intake Form",
  version: "1.0.0",
  sections: cpProgramIntakeSections,
  metadata: {
    estimatedDurationMinutes: 35,
    professions: [
      "GENERAL_PAEDIATRICIAN",
      "DEVELOPMENTAL_PAEDIATRICIAN",
      "PAEDIATRIC_NEUROLOGIST",
      "NEURODEVELOPMENTAL_PAEDIATRICIAN",
      "REHABILITATION_PAEDIATRICIAN"
    ],
    intakeOnly: true
  }
};
