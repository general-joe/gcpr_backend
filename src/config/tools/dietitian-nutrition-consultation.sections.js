export const dietitianNutritionConsultationSections = [
  {
    code: "PATIENT_INFO",
    name: "Patient Information",
    items: [
      { id: "reasonForVisit", type: "TEXTAREA", text: "Reason for seeing dietitian:" },
      { id: "gender", type: "SELECT", text: "Gender:", options: ["M", "F"] },
      { id: "age", type: "NUMBER", text: "Age:" },
      { id: "height", type: "NUMBER", text: "Ht. (height):" },
      { id: "weight", type: "NUMBER", text: "Wt. (weight):" },
      { id: "desiredWeight", type: "NUMBER", text: "Desired Wt.:" },
      { id: "bmi", type: "NUMBER", text: "BMI:" },
      { id: "bee", type: "NUMBER", text: "BEE (Basal Energy Expenditure):" },
      { id: "sbgi", type: "NUMBER", text: "SBGM:" },
      { id: "fbgi", type: "NUMBER", text: "FBG:" }
    ]
  },
  {
    code: "SYMPTOMS_CHECKLIST",
    name: "Symptoms Checklist",
    items: [
      { id: "unexplainedWeightLoss", type: "CHECKBOX", text: "Unexplained weight loss" },
      { id: "diarrhea", type: "CHECKBOX", text: "Diarrhea" },
      { id: "changeOfAppetite", type: "CHECKBOX", text: "Change of appetite" },
      { id: "unexplainedWeightGain", type: "CHECKBOX", text: "Unexplained weight gain" },
      { id: "constipation", type: "CHECKBOX", text: "Constipation" },
      { id: "bingeEating", type: "CHECKBOX", text: "Binge eating" },
      { id: "difficultySwallowing", type: "CHECKBOX", text: "Difficulty swallowing" },
      { id: "heartburn", type: "CHECKBOX", text: "Heartburn" },
      { id: "boredomEating", type: "CHECKBOX", text: "Boredom eating" },
      { id: "difficultyChewing", type: "CHECKBOX", text: "Difficulty chewing" },
      { id: "excessGas", type: "CHECKBOX", text: "Excess gas" },
      { id: "depression", type: "CHECKBOX", text: "Depression" },
      { id: "nausea", type: "CHECKBOX", text: "Nausea" },
      { id: "stomachAbdominalPain", type: "CHECKBOX", text: "Stomach or abdominal pain" },
      { id: "vomiting", type: "CHECKBOX", text: "Vomiting" },
      { id: "stress", type: "CHECKBOX", text: "Stress" }
    ]
  },
  {
    code: "DIETARY_INFO",
    name: "Dietary Information",
    items: [
      { id: "foodAllergies", type: "TEXTAREA", text: "Food allergies/intolerances, please list:" },
      { id: "specialDiet", type: "RADIO", text: "Are you currently following any special diet?", options: [{value: "No", text: "No"}, {value: "Yes", text: "Yes"}] },
      { id: "specialDietDescription", type: "TEXTAREA", text: "If yes, describe:" },
      { id: "previousDiets", type: "TEXTAREA", text: "List any previous diets you have used:" },
      { id: "mealsPerDay", type: "NUMBER", text: "How many meals a day do you eat?" },
      { id: "snacksPerDay", type: "NUMBER", text: "How many snacks a day?" },
      { id: "mealPreparation", type: "TEXTAREA", text: "Who prepares your meals?" },
      { id: "groceryShopping", type: "TEXTAREA", text: "Who does the grocery shopping?" },
      { id: "eatingAwayFromHome", type: "TEXTAREA", text: "How often do you eat away from home?" },
      { id: "regularRestaurants", type: "TEXTAREA", text: "List restaurants where you eat regularly:" }
    ]
  },
  {
    code: "LIFESTYLE_FACTORS",
    name: "Lifestyle Factors",
    items: [
      { id: "alcoholConsumption", type: "TEXTAREA", text: "How much alcohol do you drink? Number of drinks:" },
      { id: "exercise", type: "RADIO", text: "Do you exercise?", options: [{value: "No", text: "No"}, {value: "Yes", text: "Yes"}] },
      { id: "exerciseDescription", type: "TEXTAREA", text: "If yes, describe type & amount:" },
      { id: "livingSituation", type: "TEXTAREA", text: "With whom do you live?" },
      { id: "childrenAtHome", type: "TEXTAREA", text: "Number and ages of children at home:" },
      { id: "occupation", type: "TEXTAREA", text: "Your occupation:" },
      { id: "otherFactors", type: "TEXTAREA", text: "Please note anything else that may affect your eating habits, or any specific questions you have." }
    ]
  },
  {
    code: "MEDICATIONS_SUPPLEMENTS",
    name: "Medications and Supplements",
    items: [
      { id: "prescriptionOTCDrugs", type: "TEXTAREA", text: "Please list your current prescription and over-the-counter drugs:" },
      { id: "nutritionalSupplements", type: "TEXTAREA", text: "Please bring all nutritional supplements that you take to your appointment." },
      { id: "peMpgHcg", type: "TEXTAREA", text: "PE: MPG, HCG, Menu: B, L, D, S" },
      { id: "beverages", type: "TEXTAREA", text: "Bev:" },
      { id: "pDLevels", type: "TEXTAREA", text: "P: D:" },
      { id: "vitaminsMinerals", type: "TEXTAREA", text: "Vitamins/Minerals: (include amount if known)" },
      { id: "eOLevels", type: "TEXTAREA", text: "E: O:" },
      { id: "herbalSupplements", type: "TEXTAREA", text: "Herbal or other nutritional supplements: (include amount if known)" },
      { id: "followUp", type: "TEXTAREA", text: "F/U: wks, mo, TC, PRN, cls" },
      { id: "followUpWks", type: "NUMBER", text: "q wks" },
      { id: "appointmentTime", type: "SELECT", text: "Time:", options: ["15", "30", "45", "60", "75", "90"] }
    ]
  },
  {
    code: "FOOD_BEVERAGE_LOG",
    name: "Food and Beverage Log for 3 Days",
    items: [
      { id: "foodLogInstructions", type: "TEXTAREA", text: "To get the most from your appointment with the dietitian please record what you eat and drink for 3 typical days. These should not be “perfect” days or how you think you should eat but rather an accurate record of your actual food and beverage intake. Please bring the completed forms to your appointment with the dietitian.\n\n1. Write food eaten in one day only on each page. Write one food only on each line.\n2. Write down what you eat or drink at the time that you eat it. Recalling your food intake several hours or days later is highly inaccurate. Include as much detail as possible.\n○ Instead of listing “sandwich”, list on separate lines, the kind and size of bread, the kind of filling and anything spread on the bread.\n○ Instead of listing “chicken”, write the part of the chicken (breast, leg, etc, or light or dark meat), how it's cooked (fried, baked, BBQ, etc) and any sauce or breading on it.\n○ If you ate a standardized food such as a fast food sandwich, list the restaurant and the menu item, rather than listing each ingredient of the sandwich.\n3. Measure amounts of foods using a liquid measuring cup for liquids and a dry measuring cup for other foods such as cereal, rice, pasta, etc. Record the amount in the amount column.\n4. Record the time (including AM or PM) that a meal or snack is eaten.\n5. Indicate where the food is prepared. “H” for food made at home, “A” for foods prepared away from home in a restaurant, friend’s home, etc." },
      { id: "foodLogDay1", type: "TEXTAREA", text: "Day 1 Food Log:" },
      { id: "foodLogDay2", type: "TEXTAREA", text: "Day 2 Food Log:" },
      { id: "foodLogDay3", type: "TEXTAREA", text: "Day 3 Food Log:" }
    ]
  }
];