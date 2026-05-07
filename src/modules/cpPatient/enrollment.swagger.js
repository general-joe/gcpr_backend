/**
 * @swagger
 * tags:
 *   name: Enrollment
 *   description: CP patient program enrollment and tracking
 */

/**
 * @swagger
 * /enrollment:
 *   post:
 *     summary: Enroll a patient into program tracking
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               programName:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patient enrolled successfully
 */

/**
 * @swagger
 * /enrollment/patient/{patientId}:
 *   get:
 *     summary: Get enrollment records by patient
 *     tags: [Enrollment]
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
 *         description: Enrollment record retrieved
 */

/**
 * @swagger
 * /enrollment/{id}:
 *   patch:
 *     summary: Update enrollment status (SERVICE_PROVIDER only)
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                 enum: [SUSPENDED, COMPLETED, WITHDRAWN]
 *               unenrollReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Enrollment updated
 */

/**
 * @swagger
 * /enrollment/stats:
 *   get:
 *     summary: Get enrollment statistics (SERVICE_PROVIDER only)
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollment statistics retrieved
 */
