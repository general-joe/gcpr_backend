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
 *             required: [fullName, dateOfBirth, gender, address, placeOfBirth, relationToCaregiver, householdSize]
 *             properties:
 *               fullName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE]
 *               address:
 *                 type: string
 *               placeOfBirth:
 *                 type: string
 *               birthWeight:
 *                 type: number
 *               numberOfSiblings:
 *                 type: number
 *               relationToCaregiver:
 *                 type: string
 *                 enum: [PARENT, GUARDIAN, SIBLING, OTHER]
 *               householdSize:
 *                 type: number
 *               schoolEnrollmmentStatus:
 *                 type: boolean
 *               typeOfSchool:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE, SPECIAL_NEEDS]
 *     responses:
 *       200:
 *         description: CP patient created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (CAREGIVER only)
 *   get:
 *     summary: Get CP patients for authenticated caregiver
 *     tags: [CP Patient]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patients fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (CAREGIVER only)
 *       404:
 *         description: Caregiver profile not found
 */
