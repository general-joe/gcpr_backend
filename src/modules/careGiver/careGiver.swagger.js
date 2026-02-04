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
 *                 description: Determines which fields are required
 *
 *               # INDIVIDUAL FIELDS
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
 *               # GROUP FIELDS
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
 *                 description: Required when type=GROUP
 *     responses:
 *       200:
 *         description: Caregiver profile completed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
