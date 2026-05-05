/**
 * @swagger
 * tags:
 *   name: Functional Classification
 *   description: Record and retrieve CP functional classification levels (GMFCS, MACS, CFCS, EDACS, Viking Speech Scale)
 *
 * /functional-classification:
 *   post:
 *     summary: Record a new functional classification for a patient
 *     tags: [Functional Classification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFunctionalClassification'
 *           example:
 *             patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *             classifier: "GMFCS"
 *             level: 2
 *             assessedAt: "2026-05-01T09:00:00.000Z"
 *             notes: "Improved balance since last visit"
 *     responses:
 *       201:
 *         description: Functional classification recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/FunctionalClassification'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — SERVICE_PROVIDER only
 *
 * /functional-classification/patient/{patientId}:
 *   get:
 *     summary: List all functional classifications for a patient
 *     tags: [Functional Classification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Patient ID
 *       - in: query
 *         name: classifier
 *         schema:
 *           type: string
 *           enum: [GMFCS, MACS, CFCS, EDACS, VIKING_SPEECH_SCALE, OTHER]
 *         description: Filter by classifier type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Classifications retrieved successfully
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
 *                     records:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FunctionalClassification'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — SERVICE_PROVIDER only
 *
 * /functional-classification/patient/{patientId}/summary:
 *   get:
 *     summary: Get a functional classification progress summary for a patient
 *     tags: [Functional Classification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/FunctionalClassificationSummary'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — SERVICE_PROVIDER only
 *       404:
 *         description: Patient not found
 *
 * /functional-classification/{id}:
 *   get:
 *     summary: Get a single functional classification record
 *     tags: [Functional Classification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Classification record ID
 *     responses:
 *       200:
 *         description: Record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/FunctionalClassification'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — SERVICE_PROVIDER only
 *       404:
 *         description: Record not found
 *   patch:
 *     summary: Update a functional classification record
 *     tags: [Functional Classification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Classification record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateFunctionalClassification'
 *     responses:
 *       200:
 *         description: Record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/FunctionalClassification'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — SERVICE_PROVIDER only
 *       404:
 *         description: Record not found
 *   delete:
 *     summary: Delete a functional classification record
 *     tags: [Functional Classification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Classification record ID
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — SERVICE_PROVIDER only
 *       404:
 *         description: Record not found
 *
 * components:
 *   schemas:
 *     CreateFunctionalClassification:
 *       type: object
 *       required:
 *         - patientId
 *         - classifier
 *         - level
 *         - assessedAt
 *       properties:
 *         patientId:
 *           type: string
 *           format: uuid
 *         classifier:
 *           type: string
 *           enum: [GMFCS, MACS, CFCS, EDACS, VIKING_SPEECH_SCALE, OTHER]
 *         level:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 2
 *         assessedAt:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           nullable: true
 *     UpdateFunctionalClassification:
 *       type: object
 *       properties:
 *         level:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         assessedAt:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           nullable: true
 *     FunctionalClassification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *           format: uuid
 *         assessorId:
 *           type: string
 *           format: uuid
 *         classifier:
 *           type: string
 *           enum: [GMFCS, MACS, CFCS, EDACS, VIKING_SPEECH_SCALE, OTHER]
 *         level:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         assessedAt:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     FunctionalClassificationSummary:
 *       type: object
 *       properties:
 *         patientId:
 *           type: string
 *           format: uuid
 *         classifiers:
 *           type: object
 *           additionalProperties:
 *             type: object
 *             properties:
 *               latest:
 *                 $ref: '#/components/schemas/FunctionalClassification'
 *               history:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/FunctionalClassification'
 *               trend:
 *                 type: string
 *                 enum: [improving, stable, declining]
 *                 nullable: true
 */
