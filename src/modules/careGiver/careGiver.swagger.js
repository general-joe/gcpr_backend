/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *           nullable: true
 *         phoneNumber:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE]
 *         verified:
 *           type: boolean
 *         profileCompleted:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CpPatient:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         fullName:
 *           type: string
 *         age:
 *           type: integer
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE]
 *         relationToCaregiver:
 *           type: string
 *           enum: [PARENT, GUARDIAN, SIBLING, OTHER]
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Caregiver:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [INDIVIDUAL, GROUP]
 *
 *         # INDIVIDUAL
 *         occupation:
 *           type: string
 *           nullable: true
 *         educationLevel:
 *           type: string
 *           enum: [BASIC, HIGHSCHOOL, TERTIARY]
 *           nullable: true
 *         idType:
 *           type: string
 *           enum: [NATIONAL_ID, PASSPORT, DRIVER_LICENSE, ECOWAS_ID]
 *           nullable: true
 *         idNumber:
 *           type: string
 *           nullable: true
 *
 *         # GROUP
 *         nameOfGroup:
 *           type: string
 *           nullable: true
 *         locationOfGroup:
 *           type: string
 *           nullable: true
 *         groupContact:
 *           type: string
 *           nullable: true
 *         groupDigitalAddress:
 *           type: string
 *           nullable: true
 *         groupEmail:
 *           type: string
 *           nullable: true
 *         ManagerName:
 *           type: string
 *           nullable: true
 *         managerContact:
 *           type: string
 *           nullable: true
 *         verificationDocuments:
 *           type: array
 *           items:
 *             type: string
 *
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *         cpPatients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CpPatient'
 *
 *         createdAt:
 *           type: string
 *           format: date-time
 */
/**
 * @swagger
 * /caregiver/complete-profile:
 *   post:
 *     summary: Complete caregiver profile
 *     tags: [Caregiver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [INDIVIDUAL, GROUP]
 *
 *               occupation:
 *                 type: string
 *               educationLevel:
 *                 type: string
 *                 enum: [BASIC, HIGHSCHOOL, TERTIARY]
 *               idType:
 *                 type: string
 *                 enum: [NATIONAL_ID, PASSPORT, DRIVER_LICENSE, ECOWAS_ID]
 *               idNumber:
 *                 type: string
 *
 *               nameOfGroup:
 *                 type: string
 *               locationOfGroup:
 *                 type: string
 *               groupContact:
 *                 type: string
 *               groupDigitalAddress:
 *                 type: string
 *               groupEmail:
 *                 type: string
 *               ManagerName:
 *                 type: string
 *               managerContact:
 *                 type: string
 *
 *               verificationDocuments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Caregiver profile completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Caregiver'
 */
/**
 * @swagger
 * /caregiver:
 *   get:
 *     summary: Get caregivers
 *     tags: [Caregiver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Caregivers fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: object
 *                   properties:
 *                     careGivers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Caregiver'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 */
