import { z } from 'zod';

/**
 * BASE SIGN UP (DO NOT TOUCH)
 */
export const signUpSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  digitalAddress: z.string().optional(),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  gender: z.enum(['MALE', 'FEMALE'], 'Gender must be MALE or FEMALE'),
  role: z.enum(['SERVICE_PROVIDER', 'CAREGIVER']),
  profileImage: z.string().optional(),
});

/**
 * SERVICE PROVIDER PROFILE
 */
export const serviceProviderProfileSchema = z.object({
  licenseDetails: z.array(z.string()).min(1, 'License details required'),

  licenseNumber: z.string().min(1, 'License number is required'),
  licenseImage: z.string().optional(),
  licenseExpiry: z.string().min(1, 'License expiry date is required'),
  licenseIssuedBy: z.string().optional(),
  licenseIssuedDate: z.string().min(1, 'License issued date is required'),

  licenseType: z.string().min(1, 'License type is required'),

  profession: z.enum([
    'GENERAL_PAEDIATRICIAN',
    'DEVELOPMENTAL_PAEDIATRICIAN',
    'PAEDIATRIC_NEUROLOGIST',
    'NEURODEVELOPMENTAL_PAEDIATRICIAN',
    'REHABILITATION_PAEDIATRICIAN',
    'PHYSIOTHERAPIST',
    'OCCUPATIONAL_THERAPIST',
    'SPEECH_THERAPIST',
    'CLINICAL_PSYCHOLOGIST',
    'DIETITIAN',
    'PHARMACIST',
  ]),

  facilityType: z.enum([
    'TERTIARY_TEACHING_HOSPITAL',
    'REGIONAL_HOSPITAL',
    'SECONDARY_HEALTH_CARE',
    'PRIMARY_HEALTHCARE',
    'CP_HOME',
  ]),

  facilityName: z.string().min(1, 'Facility name is required'),
  facilityAddress: z.string().min(1, 'Facility address is required'),

  experience: z.number().int().min(0, 'Experience must be 0 or greater'),
});

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

    ManagerName: z.string().min(1, 'Manager name is required'),
    managerContact: z.string().min(1, 'Manager contact is required'),

    verificationDocuments: z.array(z.string()).min(1, 'Verification documents required'),
  }),
]);

