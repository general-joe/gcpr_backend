/**
 * @swagger
 * tags:
 *   name: Adherence
 *   description: Rehabilitation task adherence logs and summaries
 */

/**
 * @swagger
 * /adherence/tasks/{taskId}/logs:
 *   get:
 *     summary: Get adherence logs for a task
 *     tags: [Adherence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Logs retrieved
 *   post:
 *     summary: Mark task log as completed (CAREGIVER only)
 *     tags: [Adherence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [logDate]
 *             properties:
 *               logDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Log marked completed
 */

/**
 * @swagger
 * /adherence/tasks/{taskId}/logs/{logId}:
 *   patch:
 *     summary: Update adherence log (SERVICE_PROVIDER only)
 *     tags: [Adherence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [EXCUSED, PARTIAL, COMPLETED, MISSED]
 *               logDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Log updated
 */

/**
 * @swagger
 * /adherence/patients/{patientId}/summary:
 *   get:
 *     summary: Get adherence summary for patient
 *     tags: [Adherence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Adherence summary retrieved
 */

/**
 * @swagger
 * /adherence/tasks/{taskId}/calendar:
 *   get:
 *     summary: Get adherence calendar view for task
 *     tags: [Adherence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Calendar view retrieved
 */
