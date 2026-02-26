import { homeRehabPharmacySections } from "./home-rehab-pharmacy.sections.js";

export default {
  toolCode: "HOME_REHAB_PHARMACY_PRESCRIPTION",
  toolName: "Home-Based Rehabilitation Pharmacy Form",
  version: "1.0.0",
  sections: homeRehabPharmacySections,
  metadata: {
    estimatedDurationMinutes: 20,
    professions: ["PHARMACIST"]
  }
};
