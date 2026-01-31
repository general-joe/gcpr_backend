import { z } from 'zod';

const signUpSchema = z.object({
	fullName: z.string().min(1, 'Full name is required'),
	email: z.email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	dateOfBirth: z.string().optional(), // ISO string, can be refined if needed
	address: z.string().optional(),
	digitalAddress: z.string().optional(),
	phoneNumber: z.string().min(1, 'Phone number is required'),
	gender: z.string().min(1, 'Gender is required'),
	role: z.enum(['SERVICE_PROVIDER', 'CAREGIVER']),
	profileImage: z.string().optional(),
});


export default signUpSchema;
