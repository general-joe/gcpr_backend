/**
 * @swagger
 * /assessment/tools:
 *   get:
 *     summary: Get assessment tools with code and professions allowed to use each tool
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assessment tools retrieved successfully
 */

/**
 * @swagger
 * /assessment/tools/{toolCode}/form:
 *   get:
 *     summary: Get normalized form schema for a tool code
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: toolCode
 *         required: true
 *         schema:
 *           type: string
 *         example: GMFM_88
 *     responses:
 *       200:
 *         description: Assessment form schema retrieved successfully
 *       404:
 *         description: Tool not found
 */

/**
 * @swagger
 * /assessment/submit:
 *   post:
 *     summary: Submit a clinical assessment
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, toolCode, responses]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               toolCode:
 *                 type: string
 *                 example: GMFM_88
 *               toolVersion:
 *                 type: string
 *                 example: "1.0.0"
 *               status:
 *                 type: string
 *                 enum: [DRAFT, COMPLETED]
 *               responses:
 *                 type: object
 *                 additionalProperties: true
 *           example:
 *             patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *             toolCode: "GMFM_88"
 *             status: "COMPLETED"
 *             responses:
 *               A1: 3
 *               A2: 2
 *               B18: 1
 *               C40: NT
 *     responses:
 *       200:
 *         description: Assessment submitted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (profession or access restriction)
 *       422:
 *         description: Validation or business-rule error
 */

/**
 * @swagger
 * /assessment/referrals:
 *   post:
 *     summary: Create referral independently from assessment submission (physiotherapist only)
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, toProfession, reason]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               assessmentId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional assessment to attach the referral to
 *               toProfession:
 *                 type: string
 *                 enum:
 *                   - GENERAL_PAEDIATRICIAN
 *                   - DEVELOPMENTAL_PAEDIATRICIAN
 *                   - PAEDIATRIC_NEUROLOGIST
 *                   - NEURODEVELOPMENTAL_PAEDIATRICIAN
 *                   - REHABILITATION_PAEDIATRICIAN
 *                   - PHYSIOTHERAPIST
 *                   - OCCUPATIONAL_THERAPIST
 *                   - SPEECH_THERAPIST
 *                   - CLINICAL_PSYCHOLOGIST
 *                   - DIETITIAN
 *                   - PHARMACIST
 *               toProviderId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional provider. Omit to route by profession. Can be your own provider id.
 *               reason:
 *                 type: string
 *                 example: "Needs occupational therapy for fine motor and ADL intervention"
 *           example:
 *             patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *             assessmentId: "2af4f668-3026-47d0-9c81-d40f5323f10b"
 *             toProfession: "OCCUPATIONAL_THERAPIST"
 *             toProviderId: "54f8abf1-85e4-4cf6-b8ca-bc16e8a6f8d1"
 *             reason: "Requires OT intervention for upper limb function"
 *     responses:
 *       200:
 *         description: Referral created successfully
 */

/**
 * @swagger
 * /assessment/{assessmentId}/report:
 *   get:
 *     summary: Get latest clinical report for an assessment (authorized care team only)
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Clinical assessment report retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Assessment/report not found
 */

/**
 * @swagger
 * /assessment/patient/{patientId}/reports:
 *   get:
 *     summary: Get assessment history for a patient (authorized care team only)
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patient assessment reports retrieved successfully
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /assessment/referrals/incoming:
 *   get:
 *     summary: Get incoming referrals for logged-in provider
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Incoming referrals retrieved successfully
 */

/**
 * @swagger
 * /assessment/referrals/outgoing:
 *   get:
 *     summary: Get outgoing referrals created by logged-in provider
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Outgoing referrals retrieved successfully
 */

/**
 * @swagger
 * /assessment/referrals/{referralId}/status:
 *   patch:
 *     summary: Accept/decline/complete a referral (target provider only)
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: referralId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACCEPTED, DECLINED, COMPLETED]
 *           example:
 *             status: ACCEPTED
 *     responses:
 *       200:
 *         description: Referral status updated successfully
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /assessment/referrals/{referralId}/tasks:
 *   post:
 *     summary: Assign rehab task to referred patient (target provider, accepted referral)
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: referralId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, instructions, durationDays]
 *             properties:
 *               title:
 *                 type: string
 *               instructions:
 *                 type: string
 *               instructionSteps:
 *                 type: array
 *                 items:
 *                   type: string
 *               frequencyPerDay:
 *                 type: integer
 *               frequencyNote:
 *                 type: string
 *               durationDays:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               videoUrl:
 *                 type: string
 *                 description: Direct URL to the rehab task video
 *               video:
 *                 type: object
 *                 additionalProperties: true
 *           example:
 *             title: "Daily trunk balance training"
 *             instructions: "Perform seated trunk reaches with caregiver support"
 *             instructionSteps:
 *               - "Sit on firm chair with hips/knees at 90 degrees"
 *               - "Reach for toy placed slightly outside base of support"
 *             frequencyPerDay: 2
 *             frequencyNote: "Morning and evening"
 *             durationDays: 21
 *             videoUrl: "https://www.youtube.com/watch?v=XXXXXXXXXXX"
 *     responses:
 *       200:
 *         description: Rehab task assigned successfully
 *       422:
 *         description: Referral not accepted or invalid payload
 */

/**
 * @swagger
 * /assessment/tasks/my:
 *   get:
 *     summary: Get rehab tasks assigned to logged-in provider
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assigned rehab tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 tasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       instructions:
 *                         type: string
 *                       frequencyPerDay:
 *                         type: number
 *                       durationDays:
 *                         type: number
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       endDate:
 *                         type: string
 *                         format: date-time
 *                       videoUrl:
 *                         type: string
 *                         description: Direct URL to the rehab task video
 *                       status:
 *                         type: string
 *                         enum: [PENDING, ASSIGNED, COMPLETED]
 *                       progress:
 *                         type: integer
 *                         minimum: 0
 *                         maximum: 100
 */
