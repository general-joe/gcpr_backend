export const homeRehabPharmacySections = [
  {
    code: "PRESCRIPTION_PATIENT_DETAILS",
    name: "Prescription and Patient Details",
    items: [
      { id: "caregiverOrPatientName", type: "TEXT", text: "Caregiver or Patient Name" },
      { id: "caregiverOrPatientContact", type: "TEXT", text: "Caregiver or Patient Contact" },
      { id: "caregiverLocation", type: "TEXT", text: "Caregiver Location" },
      { id: "prescribingPhysicianName", type: "TEXT", text: "Prescribing Physician Name" },
      {
        id: "prescribingPhysicianContact",
        type: "TEXT",
        text: "Prescribing Physician Contact"
      },
      { id: "prescriptionIssuedDate", type: "DATE", text: "Prescription Issued Date" }
    ]
  },
  {
    code: "MEDICATION_INFORMATION",
    name: "Medication Information",
    items: [
      { id: "selectedPharmacy", type: "TEXT", text: "Selected Pharmacy" },
      { id: "drugName", type: "TEXT", text: "Drug Name" },
      { id: "formulationDetails", type: "TEXT", text: "Formulation Details" },
      { id: "dose", type: "TEXT", text: "Dose" },
      { id: "doseSuggestions", type: "TEXT", text: "Dose Suggestions" },
      {
        id: "dosageFrequency",
        type: "SELECT",
        text: "Dosage Frequency",
        options: ["ONCE_DAILY", "TWICE_DAILY", "THRICE_DAILY", "CUSTOM"]
      },
      { id: "durationDays", type: "NUMBER", text: "Duration (Days)" },
      { id: "calculatedTotalQuantity", type: "NUMBER", text: "Calculated Total Quantity" },
      { id: "specialInstructions", type: "TEXT", text: "Special Instructions" },
      { id: "indication", type: "TEXT", text: "Indication" },
      { id: "substitutionOptions", type: "TEXT", text: "Substitution Options" },
      {
        id: "dispensingAndPackagingInstructions",
        type: "TEXT",
        text: "Dispensing and Packaging Instructions"
      }
    ]
  },
  {
    code: "MONITORING_FOLLOW_UP",
    name: "Monitoring and Follow-Up",
    items: [
      { id: "highRiskMonitoringAlerts", type: "TEXT", text: "High-Risk Monitoring Alerts" },
      { id: "previousDispensingHistory", type: "TEXT", text: "Previous Dispensing History" },
      {
        id: "physicianFeedbackChannel",
        type: "TEXT",
        text: "Physician Feedback Channel"
      },
      {
        id: "deliveryRecordAndTimestamps",
        type: "TEXT",
        text: "Delivery Record and Timestamps"
      }
    ]
  },
  {
    code: "ADMINISTRATIVE_INFORMATION",
    name: "Administrative Information",
    items: [
      {
        id: "prescriptionStatus",
        type: "SELECT",
        text: "Prescription Status",
        options: ["PENDING", "PREPARED", "DISPENSED", "DELIVERED"]
      },
      { id: "deliveryTrackingDetails", type: "TEXT", text: "Delivery Tracking Details" }
    ]
  }
];

