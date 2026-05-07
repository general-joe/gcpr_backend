/**
 * @swagger
 * tags:
 *   name: Outcomes
 *   description: Motor function outcomes tracking and reporting
 */

/**
 * @swagger
 * /outcomes:
 *   post:
 *     summary: Create a motor function outcome record (SERVICE_PROVIDER only)
 *     tags: [Outcomes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, baselineLevel, currentLevel, baselineDate, reviewDate]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               baselineLevel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               currentLevel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               baselineDate:
 *                 type: string
 *                 format: date-time
 *               reviewDate:
 *                 type: string
 *                 format: date-time
 *               assessmentToolUsed:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Outcome record created
 */

/**
 * @swagger
 * /outcomes/provider/summary:
 *   get:
 *     summary: Get outcome summary for provider (SERVICE_PROVIDER only)
 *     tags: [Outcomes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provider summary retrieved
 */

/**
 * @swagger
 * /outcomes/patient/{patientId}:
 *   get:
 *     summary: List patient outcome records
 *     tags: [Outcomes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Outcomes retrieved
 */

/**
 * @swagger
 * /outcomes/patient/{patientId}/latest:
 *   get:
 *     summary: Get latest patient outcome record
 *     tags: [Outcomes]
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
 *         description: Latest outcome retrieved
 */

/**
 * @swagger
 * /outcomes/{id}:
 *   get:
 *     summary: Get outcome record by ID
 *     tags: [Outcomes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Outcome retrieved
 *   patch:
 *     summary: Update outcome record (SERVICE_PROVIDER only)
 *     tags: [Outcomes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assessmentToolUsed:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Outcome updated
 *   delete:
 *     summary: Delete outcome record (SERVICE_PROVIDER only)
 *     tags: [Outcomes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Outcome deleted
 */
