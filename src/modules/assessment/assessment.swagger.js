/**
 * @swagger
 * /assessment/submit:
 *   post:
 *     summary: Submit a clinical assessment
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - toolCode
 *               - responses
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *                 example: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *
 *               toolCode:
 *                 type: string
 *                 example: GMFM_88
 *
 *               toolVersion:
 *                 type: string
 *                 example: "1.0.0"
 *
 *               status:
 *                 type: string
 *                 enum: [DRAFT, COMPLETED]
 *                 example: COMPLETED
 *
 *               responses:
 *                 type: object
 *                 description: Tool-specific response payload
 *                 example:
 *                   A1: 3
 *                   A2: 2
 *                   B18: 1
 *                   C40: NT
 *
 *     responses:
 *       200:
 *         description: Assessment submitted successfully
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
 *                   example: Assessment submitted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     assessment:
 *                       type: object
 *                     report:
 *                       type: object
 *
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a service provider)
 *       500:
 *         description: Internal server error
 */
