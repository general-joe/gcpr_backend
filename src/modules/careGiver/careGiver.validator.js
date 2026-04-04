import { z } from "zod";
/**
 * CAREGIVER PROFILE (INDIVIDUAL OR GROUP)
 */
export const caregiverProfileSchema = z.discriminatedUnion('type', [
  // INDIVIDUAL CAREGIVER
  z.object({
    type: z.literal('INDIVIDUAL'),

    occupation: z.string().min(1, 'Occupation is required'),
    educationLevel: z.enum(['BASIC', 'HIGHSCHOOL', 'TERTIARY']),
    idType: z.enum(['NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'ECOWAS_ID']),
    idNumber: z.string().min(1, 'ID number is required'),
  }),

  // GROUP CAREGIVER
  z.object({
    type: z.literal('GROUP'),

    nameOfGroup: z.string().min(1, 'Group name is required'),
    locationOfGroup: z.string().min(1, 'Group location is required'),
    groupContact: z.string().min(1, 'Group contact is required'),
    groupDigitalAddress: z.string().optional(),
    groupEmail: z.email('Invalid group email'),

    managerName: z.string().min(1, 'Manager name is required'),
    managerContact: z.string().min(1, 'Manager contact is required'),

    verificationDocuments: z.array(z.string()).min(1, 'Verification documents required'),
  }),
]);