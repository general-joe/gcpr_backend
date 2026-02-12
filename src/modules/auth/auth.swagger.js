/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *         phoneNumber:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE]
 *         role:
 *           type: string
 *           enum: [SERVICE_PROVIDER, CAREGIVER]
 *         profileImage:
 *           type: string
 *           nullable: true
 *         verified:
 *           type: boolean
 *
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - password
 *         - phoneNumber
 *         - gender
 *         - role
 *         - otpChannel
 *       properties:
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *         phoneNumber:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE]
 *         role:
 *           type: string
 *           enum: [SERVICE_PROVIDER, CAREGIVER]
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           nullable: true
 *         address:
 *           type: string
 *           nullable: true
 *         digitalAddress:
 *           type: string
 *           nullable: true
 *         profileImage:
 *           type: string
 *           format: binary
 *           description: Selfie/profile image (required)
 *         otpChannel:
 *           type: string
 *           enum: [sms, email]
 *
 *     OTPVerification:
 *       type: object
 *       required:
 *         - identifier
 *         - otp
 *       properties:
 *         identifier:
 *           type: string
 *           description: Email address or phone number
 *         otp:
 *           type: string
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - identifier
 *         - password
 *       properties:
 *         identifier:
 *           type: string
 *           description: Email address or phone number
 *         password:
 *           type: string
 *           format: password
 *
 *     ForgotPasswordRequest:
 *       type: object
 *       required:
 *         - identifier
 *       properties:
 *         identifier:
 *           type: string
 *           description: Email address or phone number
 *
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - identifier
 *         - otp
 *         - newPassword
 *       properties:
 *         identifier:
 *           type: string
 *           description: Email address or phone number
 *         otp:
 *           type: string
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 6
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     security: []
 *     description: >
 *       Registers a new user and sends an OTP via the selected channel (SMS or Email).
 *       Profile image (selfie) is required.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful, OTP sent
 *       409:
 *         description: User with this email or phone number already exists
 *
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP and activate account
 *     security: []
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPVerification'
 *     responses:
 *       200:
 *         description: Account verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid OTP
 *       410:
 *         description: OTP expired
 *
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     security: []
 *     description: Resends a new OTP to the user's registered email or phone number
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       404:
 *         description: User or OTP session not found
 *       400:
 *         description: Failed to resend OTP or invalid configuration
 *
 * /auth/login:
 *   post:
 *     summary: Login user
 *     security: []
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     security: []
 *     description: Sends a password reset OTP to the user's email or phone number
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset OTP sent
 *       404:
 *         description: User not found
 *
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     security: []
 *     description: Resets the user's password using a valid OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired OTP
 */
