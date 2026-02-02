import { z } from "zod";

/**
 * SERVICE PROVIDER PROFILE
 */
export const serviceProviderProfileSchema = z.object({
  licenseDetails: z.array(z.string()).min(1, "License details required"),

  licenseNumber: z.string().min(1, "License number is required"),
  licenseImage: z.string().optional(),

  licenseIssuedBy: z.string().optional(),
  licenseExpiry: z.coerce.date(),
  licenseIssuedDate: z.coerce.date(),

  licenseType: z.enum(["AHPC", "MDC", "PHCG", "PSCG"]),

  profession: z.enum([
    "GENERAL_PAEDIATRICIAN",
    "DEVELOPMENTAL_PAEDIATRICIAN",
    "PAEDIATRIC_NEUROLOGIST",
    "NEURODEVELOPMENTAL_PAEDIATRICIAN",
    "REHABILITATION_PAEDIATRICIAN",
    "PHYSIOTHERAPIST",
    "OCCUPATIONAL_THERAPIST",
    "SPEECH_THERAPIST",
    "CLINICAL_PSYCHOLOGIST",
    "DIETITIAN",
    "PHARMACIST",
  ]),

  facilityType: z.enum([
    "TERTIARY_TEACHING_HOSPITAL",
    "REGIONAL_HOSPITAL",
    "SECONDARY_HEALTH_CARE",
    "PRIMARY_HEALTHCARE",
    "CP_HOME",
  ]),

  facilityName: z.string().min(1, "Facility name is required"),
  facilityAddress: z.string().min(1, "Facility address is required"),

  experience: z.coerce.number().int().min(0, "Experience must be 0 or greater"),
});
