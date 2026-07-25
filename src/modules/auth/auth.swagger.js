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
 *         userType:
 *           type: string
 *           enum: [SERVICE_PROVIDER, CAREGIVER, ADMIN]
 *           description: Primary user type
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
 *         - userType
 *         - otpChannel
 *         - acceptedTerms
 *         - acceptedPrivacyPolicy
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
 *         userType:
 *           type: string
 *           enum: [SERVICE_PROVIDER, CAREGIVER, ADMIN]
 *           description: Primary user type
 *         profileImage:
 *           type: string
 *           format: date
 *           nullable: true
 *         address:
 *           type: string
 *           nullable: true
 *         digitalAddress:
 *           type: string
 *           nullable: true
 *         otpChannel:
 *           type: string
 *           enum: [sms, email]
 *         acceptedTerms:
 *           type: boolean
 *           enum: [true]
 *           description: Must be true before registration can complete
 *         acceptedPrivacyPolicy:
 *           type: boolean
 *           enum: [true]
 *           description: Must be true before registration can complete
 *         termsVersion:
 *           type: string
 *           example: "1.0"
 *         privacyPolicyVersion:
 *           type: string
 *           example: "1.0"
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
 *           description: Email address or phone number. If email is supplied, reset instructions are emailed. If phone number is supplied, reset instructions are sent by SMS.
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
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *         - userId
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Valid refresh token from login or previous token refresh
 *         userId:
 *           type: string
 *           description: User ID
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
 *       200:
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
 *     description: Sends a password reset OTP to the user's email or phone number. The mobile/web app should collect identifier, OTP, and new password, then call /auth/reset-password.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset instructions sent
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
 *
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     security: []
 *     description: Generates a new access token using a valid refresh token and user ID
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Refresh token or user ID is required
 *       401:
 *         description: Invalid or expired refresh token
 *
 * /auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     security: []
 *     description: Generates and returns the Google OAuth authorization URL for user login
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Google OAuth URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Google OAuth URL generated
 *                 data:
 *                   type: object
 *                   properties:
 *                     authUrl:
 *                       type: string
 *                       description: Google OAuth authorization URL to redirect user to
 *                       example: https://accounts.google.com/o/oauth2/auth?...
 *       500:
 *         description: Failed to generate OAuth URL
 *
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback handler
 *     security: []
 *     description: >
 *       Handles the OAuth callback from Google. This endpoint receives the authorization code
 *       from Google and exchanges it for tokens. If user doesn't exist, a new account is automatically created.
 *       Redirect here from the authUrl provided by /auth/google endpoint.
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Google OAuth
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for CSRF protection (optional)
 *     responses:
 *       200:
 *         description: Google authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Google authentication successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token for API requests
 *                     refreshToken:
 *                       type: string
 *                       description: Refresh token for obtaining new access tokens
 *                     tokens:
 *                       type: object
 *                       description: Google OAuth tokens
 *                       properties:
 *                         access_token:
 *                           type: string
 *                         refresh_token:
 *                           type: string
 *       400:
 *         description: Authorization code is required or email not available from Google
 *       401:
 *         description: Failed to authenticate with Google or retrieve user information
 *       500:
 *         description: Internal server error during OAuth processing
 */
