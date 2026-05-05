/**
 * @swagger
 * tags:
 *   - name: Report
 *     description: Report service providers and system issues
 *   - name: Admin Reports
 *     description: Admin management of submitted reports
 */

/**
 * @swagger
 * /report:
 *   post:
 *     summary: Submit a report
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reportType, subject, description]
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [SERVICE_PROVIDER, SYSTEM_ISSUE, BUG_REPORT, CONTENT, OTHER]
 *               targetUserId:
 *                 type: string
 *                 format: uuid
 *                 description: Required for SERVICE_PROVIDER reports
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Report submitted
 */

/**
 * @swagger
 * /report/my:
 *   get:
 *     summary: List own submitted reports
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, UNDER_REVIEW, RESOLVED, DISMISSED]
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reports retrieved
 */

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     summary: List all reports (admin)
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reports retrieved
 */

/**
 * @swagger
 * /admin/reports/{id}:
 *   patch:
 *     summary: Update report status (admin)
 *     tags: [Admin Reports]
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
 *               status:
 *                 type: string
 *                 enum: [PENDING, UNDER_REVIEW, RESOLVED, DISMISSED]
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report updated
 */
