/**
 * @swagger
 * /cp-patient:
 *   post:
 *     summary: Create a CP patient
 *     tags: [CP Patient]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - dateOfBirth
 *               - gender
 *               - address
 *               - placeOfBirth
 *               - caregiverId
 *               - relationToCaregiver
 *               - householdSize
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 2020-05-01
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE]
 *               address:
 *                 type: string
 *                 example: Accra
 *               placeOfBirth:
 *                 type: string
 *                 example: Korle Bu
 *               birthWeight:
 *                 type: number
 *                 example: 3.2
 *               numberOfSiblings:
 *                 type: number
 *                 example: 2
 *               caregiverId:
 *                 type: string
 *                 example: 8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa
 *               relationToCaregiver:
 *                 type: string
 *                 enum: [PARENT, GUARDIAN, SIBLING, OTHER]
 *               householdSize:
 *                 type: number
 *                 example: 5
 *               schoolEnrollmmentStatus:
 *                 type: boolean
 *                 example: false
 *               typeOfSchool:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE, SPECIAL_NEEDS]
 *
 *     responses:
 *       201:
 *         description: CP patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: CP patient created successfully
 *                 data:
 *                   $ref: '#/components/schemas/CpPatient'
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation failed
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *
 *       403:
 *         description: Forbidden (not a CAREGIVER)
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /cp-patient:
 *   get:
 *     summary: Get CP patients for the authenticated caregiver only
 *     description: Returns only patients linked to the logged-in caregiver profile. No patients belonging to other caregivers are included.
 *     tags: [CP Patient]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patients fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CpPatient'
 *                 message:
 *                   type: string
 *                   example: Patients fetched successfully
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (not a CAREGIVER)
 *       404:
 *         description: Caregiver profile not found for this user
 *       500:
 *         description: Internal server error
 */
