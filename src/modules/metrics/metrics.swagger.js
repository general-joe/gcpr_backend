/**
 * @swagger
 * tags:
 *   name: Metrics
 *   description: Provider, patient, and system-wide KPI metrics and snapshot computation
 *
 * /metrics/provider:
 *   get:
 *     summary: Get the authenticated service provider's own metrics snapshot
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [DAILY, WEEKLY, MONTHLY]
 *           default: DAILY
 *         description: Snapshot period
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-05-01"
 *         description: Target snapshot date (ISO 8601 date, defaults to today)
 *     responses:
 *       200:
 *         description: Provider metrics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ProviderMetricsSnapshot'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — SERVICE_PROVIDER only
 *
 * /metrics/patient/{patientId}:
 *   get:
 *     summary: Get metrics snapshot for a specific patient
 *     tags: [Metrics]
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
 *         name: period
 *         schema:
 *           type: string
 *           enum: [DAILY, WEEKLY, MONTHLY]
 *           default: WEEKLY
 *         description: Snapshot period
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-05-01"
 *         description: Target snapshot date (defaults to today)
 *     responses:
 *       200:
 *         description: Patient metrics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PatientMetricsSnapshot'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — SERVICE_PROVIDER or CAREGIVER
 *       404:
 *         description: Patient not found
 *
 * /metrics/system:
 *   get:
 *     summary: Get system-wide platform metrics (admin only)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [DAILY, WEEKLY, MONTHLY]
 *           default: DAILY
 *         description: Snapshot period
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-05-01"
 *         description: Target snapshot date (defaults to today)
 *     responses:
 *       200:
 *         description: System metrics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/SystemMetricsSnapshot'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — ADMIN only
 *
 * /metrics/compute/provider:
 *   post:
 *     summary: Trigger an on-demand provider metrics snapshot (admin only)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               providerId:
 *                 type: string
 *                 format: uuid
 *                 description: Provider ID (omit to compute for all providers)
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-01"
 *               period:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY]
 *                 default: DAILY
 *     responses:
 *       200:
 *         description: Provider snapshot computed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — ADMIN only
 *
 * /metrics/compute/system:
 *   post:
 *     summary: Trigger an on-demand system metrics snapshot (admin only)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-01"
 *               period:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY]
 *                 default: DAILY
 *     responses:
 *       200:
 *         description: System snapshot computed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — ADMIN only
 *
 * /metrics/compute/all:
 *   post:
 *     summary: Trigger a full batch metrics computation for all providers and system (admin only)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-01"
 *               period:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY]
 *                 default: DAILY
 *     responses:
 *       200:
 *         description: Batch computation complete
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
 *                     providerResults:
 *                       type: array
 *                       items:
 *                         type: object
 *                     systemSnapshot:
 *                       $ref: '#/components/schemas/SystemMetricsSnapshot'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — ADMIN only
 *
 * components:
 *   schemas:
 *     ProviderMetricsSnapshot:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         providerId:
 *           type: string
 *           format: uuid
 *         snapshotDate:
 *           type: string
 *           format: date
 *         period:
 *           type: string
 *           enum: [DAILY, WEEKLY, MONTHLY]
 *         totalPatients:
 *           type: integer
 *         activePatients:
 *           type: integer
 *         totalAssessments:
 *           type: integer
 *         completedAssessments:
 *           type: integer
 *         totalReferrals:
 *           type: integer
 *         totalTasks:
 *           type: integer
 *         completedTasks:
 *           type: integer
 *         adherenceRate:
 *           type: number
 *           format: float
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *     PatientMetricsSnapshot:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *           format: uuid
 *         snapshotDate:
 *           type: string
 *           format: date
 *         period:
 *           type: string
 *           enum: [DAILY, WEEKLY, MONTHLY]
 *         adherenceRate:
 *           type: number
 *           format: float
 *           nullable: true
 *         gmfcsLevel:
 *           type: integer
 *           nullable: true
 *         totalTasks:
 *           type: integer
 *         completedTasks:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *     SystemMetricsSnapshot:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         snapshotDate:
 *           type: string
 *           format: date
 *         period:
 *           type: string
 *           enum: [DAILY, WEEKLY, MONTHLY]
 *         totalUsers:
 *           type: integer
 *         activeUsers:
 *           type: integer
 *         totalPatients:
 *           type: integer
 *         totalProviders:
 *           type: integer
 *         totalAssessments:
 *           type: integer
 *         totalTasks:
 *           type: integer
 *         platformAdherenceRate:
 *           type: number
 *           format: float
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 */
