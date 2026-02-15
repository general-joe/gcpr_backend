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
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [INDIVIDUAL, GROUP]
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
 *               verificationDocuments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Caregiver profile completed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *
 * /caregiver:
 *   get:
 *     summary: Get caregivers (service provider only)
 *     tags: [Caregiver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Caregivers fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
