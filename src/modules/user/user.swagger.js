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
 *         address:
 *           type: string
 *           nullable: true
 *         digitalAddress:
 *           type: string
 *           nullable: true
 *         dateOfBirth:
 *           type: string
 *           format: date
 *
 * /user/profile:
 *   get:
 *     summary: Get authenticated user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: Returns the profile for the currently authenticated user. Requires a valid Bearer JWT.
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized or invalid token
 *       403:
 *         description: Forbidden - insufficient role permissions
 */
