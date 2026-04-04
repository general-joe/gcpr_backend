import { z } from "zod";

export const cpPatientSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"), // will parse to Date in service
  gender: z.enum(["MALE", "FEMALE"]),
  address: z.string().min(1, "Address is required"),
  placeOfBirth: z.string().min(1, "Place of birth is required"),
  birthWeight: z.number().optional(),
  numberOfSiblings: z.number().optional(),
  relationToCaregiver: z.enum(["PARENT", "GUARDIAN", "SIBLING", "OTHER"]),
  householdSize: z.number().min(1, "Household size is required"),
  schoolEnrollmentStatus: z.boolean().optional(),
  typeOfSchool: z.enum(["PUBLIC", "PRIVATE", "SPECIAL_NEEDS"]).optional(),
});

export const caregiverTaskDayDoneSchema = z
  .object({
    date: z.coerce.date().optional(),
  })
  .strict();
