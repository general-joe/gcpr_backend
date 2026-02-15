export default {
  toolCode: "HOME_REHAB_PHARMACY_PRESCRIPTION",
  toolName: "Home-Based Rehabilitation Pharmacy Form",
  version: "1.0.0",
  sections: [
    {
      code: "PRESCRIPTION_PATIENT_DETAILS",
      name: "Prescription and Patient Details",
      items: [
        { id: "caregiverOrPatientName", type: "TEXT" },
        { id: "caregiverOrPatientContact", type: "TEXT" },
        { id: "caregiverLocation", type: "TEXT" },
        { id: "prescribingPhysicianName", type: "TEXT" },
        { id: "prescribingPhysicianContact", type: "TEXT" },
        { id: "prescriptionIssuedDate", type: "DATE" }
      ]
    },
    {
      code: "MEDICATION_INFORMATION",
      name: "Medication Information",
      items: [
        { id: "selectedPharmacy", type: "TEXT" },
        { id: "drugName", type: "TEXT" },
        { id: "formulationDetails", type: "TEXT" },
        { id: "dose", type: "TEXT" },
        { id: "doseSuggestions", type: "TEXT" },
        {
          id: "dosageFrequency",
          type: "SELECT",
          options: ["ONCE_DAILY", "TWICE_DAILY", "THRICE_DAILY", "CUSTOM"]
        },
        { id: "durationDays", type: "NUMBER" },
        { id: "calculatedTotalQuantity", type: "NUMBER" },
        { id: "specialInstructions", type: "TEXT" },
        { id: "indication", type: "TEXT" },
        { id: "substitutionOptions", type: "TEXT" },
        { id: "dispensingAndPackagingInstructions", type: "TEXT" }
      ]
    },
    {
      code: "MONITORING_FOLLOW_UP",
      name: "Monitoring and Follow-Up",
      items: [
        { id: "highRiskMonitoringAlerts", type: "TEXT" },
        { id: "previousDispensingHistory", type: "TEXT" },
        { id: "physicianFeedbackChannel", type: "TEXT" },
        { id: "deliveryRecordAndTimestamps", type: "TEXT" }
      ]
    },
    {
      code: "ADMINISTRATIVE_INFORMATION",
      name: "Administrative Information",
      items: [
        {
          id: "prescriptionStatus",
          type: "SELECT",
          options: ["PENDING", "PREPARED", "DISPENSED", "DELIVERED"]
        },
        { id: "deliveryTrackingDetails", type: "TEXT" }
      ]
    }
  ],
  metadata: {
    estimatedDurationMinutes: 20,
    professions: ["PHARMACIST"]
  }
};
