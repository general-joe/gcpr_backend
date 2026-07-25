import { z } from "zod";

/**
 * BASE SIGN UP (DO NOT TOUCH)
 */
export const signUpSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required").optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  digitalAddress: z.string().optional(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  role: z.enum(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
  profileImage: z.string().optional(),
  otpChannel: z.enum(["sms", "email"]),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms and Conditions" }),
  }),
  acceptedPrivacyPolicy: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Privacy Policy" }),
  }),
  termsVersion: z.string().trim().min(1).optional(),
  privacyPolicyVersion: z.string().trim().min(1).optional(),
  verified: z.boolean().optional().default(false),
  profileCompleted: z.boolean().optional().default(false),
});
