import { dietitianNutritionConsultationSections } from "./dietitian-nutrition-consultation.sections.js";

export default {
  toolCode: "DIETITIAN_NUTRITION_CONSULTATION",
  toolName: "New Patient Nutrition Consultation",
  version: "1.0.0",
  sections: dietitianNutritionConsultationSections,
  metadata: {
    estimatedDurationMinutes: 60,
    professions: ["DIETITIAN"],
    applicableCondition: "NUTRITIONAL_ASSESSMENT"
  }
};