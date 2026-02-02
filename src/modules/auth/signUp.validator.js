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


