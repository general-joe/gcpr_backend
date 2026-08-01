import { z } from "zod";

const userRoleEnum = z.enum(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]);
const booleanLikeSchema = z.union([
  z.boolean(),
  z.string().trim().transform((value) => value.toLowerCase() === "true"),
]);
const optionalVersionSchema = z
  .union([z.string().trim().min(1), z.literal("")])
  .optional()
  .transform((value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value));

/**
 * BASE SIGN UP (DO NOT TOUCH)
 */
export const signUpSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Valid email is required").optional().nullable(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    digitalAddress: z.string().optional(),
    phoneNumber: z.string().min(1, "Phone number is required"),
    gender: z.enum(["MALE", "FEMALE"]),
    role: userRoleEnum.optional(),
    userType: userRoleEnum.optional(),
    profileImage: z.string().optional(),
    otpChannel: z.enum(["sms", "email"]),
    acceptedTerms: booleanLikeSchema.optional().default(true),
    acceptedPrivacyPolicy: booleanLikeSchema.optional().default(true),
    termsVersion: optionalVersionSchema,
    privacyPolicyVersion: optionalVersionSchema,
    verified: z.boolean().optional().default(false),
    profileCompleted: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.role && !data.userType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["role"],
        message: "Role is required",
      });
    }
  });
