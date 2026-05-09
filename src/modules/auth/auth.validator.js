import { z } from 'zod';

const normalizeIdentifier = (value) => {
  const trimmedValue = value.trim();

  return trimmedValue.includes('@')
    ? trimmedValue.toLowerCase()
    : trimmedValue;
};

const identifierSchema = z
  .string()
  .trim()
  .min(1, 'Email or phone number is required')
  .transform(normalizeIdentifier);

const passwordSchema = z.string().min(1, 'Password is required');

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: passwordSchema,
});

export const verifyOtpSchema = z.object({
  identifier: identifierSchema,
  otp: z.string().trim().min(1, 'OTP is required'),
});

export const forgotPasswordSchema = z.object({
  identifier: identifierSchema,
});

export const resetPasswordSchema = z.object({
  identifier: identifierSchema,
  otp: z.string().trim().min(1, 'OTP is required'),
  newPassword: passwordSchema,
});

export const resendOtpSchema = z.object({
  identifier: identifierSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1, 'Refresh token is required'),
  userId: z.string().trim().min(1, 'User ID is required'),
});