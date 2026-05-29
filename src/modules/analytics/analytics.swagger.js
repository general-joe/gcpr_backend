/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Dashboard Analytics endpoints for Admin, Provider, and Support
 *
 * components:
 *   schemas:
 *     AdminAnalyticsResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "success"
 *         data:
 *           type: object
 *           properties:
 *             kpis:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: object
 *                   properties:
 *                     count: { type: integer }
 *                     activePercentage: { type: number }
 *                     newCount: { type: integer }
 *                 verifiedProviders:
 *                   type: object
 *                   properties:
 *                     count: { type: integer }
 *                     pendingCount: { type: integer }
 *                     flaggedCount: { type: integer }
 *                 openSupportTickets:
 *                   type: object
 *                   properties:
 *                     count: { type: integer }
 *                     criticalCount: { type: integer }
 *                     slaStatus: { type: string, enum: [HEALTHY, WARNING, CRITICAL] }
 *                 carePlanAdherence:
 *                   type: object
 *                   properties:
 *                     onTrackPercentage: { type: number }
 *                     atRiskPercentage: { type: number }
 *                 pendingApprovals:
 *                   type: object
 *                   properties:
 *                     queueCount: { type: integer }
 *             charts:
 *               type: object
 *               properties:
 *                 providerVerification:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status: { type: string }
 *                       count: { type: integer }
 *                 cpImprovementTrend:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       day: { type: string }
 *                       value: { type: number }
 *                 assignedDailyTasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       day: { type: string }
 *                       value: { type: number }
 *
 *     ProviderAnalyticsResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "success"
 *         data:
 *           type: object
 *           properties:
 *             kpis:
 *               type: object
 *               properties:
 *                 sessionsCompleted:
 *                   type: object
 *                   properties:
 *                     count: { type: integer }
 *                     averageRating: { type: number }
 *                 referrals:
 *                   type: object
 *                   properties:
 *                     pending: { type: integer }
 *                     approved: { type: integer }
 *                     declined: { type: integer }
 *                 carePlanAdherence:
 *                   type: object
 *                   properties:
 *                     onTrackPercentage: { type: number }
 *                     atRiskPercentage: { type: number }
 *                 assignedTasks:
 *                   type: object
 *                   properties:
 *                     open: { type: integer }
 *                     done: { type: integer }
 *                 approvals:
 *                   type: object
 *                   properties:
 *                     pending: { type: integer }
 *                     approved: { type: integer }
 *                     rejected: { type: integer }
 *             charts:
 *               type: object
 *               properties:
 *                 patientProgress:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       day: { type: string }
 *                       value: { type: number }
 *                 adherenceTrend:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       day: { type: string }
 *                       value: { type: number }
 *                 assignedDailyTasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       day: { type: string }
 *                       value: { type: number }
 *                 patientRecovery:
 *                   type: object
 *                   properties:
 *                     improved: { type: integer }
 *                     stable: { type: integer }
 *                     regressed: { type: integer }
 *
 *     SupportAnalyticsResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "success"
 *         data:
 *           type: object
 *           properties:
 *             kpis:
 *               type: object
 *               properties:
 *                 openQueue:
 *                   type: object
 *                   properties:
 *                     new: { type: integer }
 *                     inProgress: { type: integer }
 *                 criticalEscalations:
 *                   type: object
 *                   properties:
 *                     count: { type: integer }
 *                 avgResponseTime:
 *                   type: object
 *                   properties:
 *                     goal: { type: string }
 *                     actual: { type: string }
 *                     slaHealth: { type: string, enum: [HEALTHY, WARNING, BREACHED] }
 *                 resolvedToday:
 *                   type: object
 *                   properties:
 *                     efficiencyPercentage: { type: number }
 *                     backlogCount: { type: integer }
 *             queues:
 *               type: object
 *               properties:
 *                 newRequests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SupportTicketMeta'
 *                 inProgress:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SupportTicketMeta'
 *                 escalated:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SupportTicketMeta'
 *
 *     SupportTicketMeta:
 *       type: object
 *       properties:
 *         ticketId: { type: string }
 *         time: { type: string, format: date-time }
 *         issueType: { type: string }
 *         description: { type: string }
 *         usersInvolved:
 *           type: array
 *           items: { type: string }
 *         priority: { type: string }
 *
 * /analytics/admin:
 *   get:
 *     tags: [Analytics]
 *     summary: Get Admin Dashboard Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [today, this_week, this_month, all_time]
 *           default: this_week
 *         description: Timeframe filter for analytics data
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminAnalyticsResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /analytics/provider:
 *   get:
 *     tags: [Analytics]
 *     summary: Get Provider Dashboard Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [today, this_week, this_month, all_time]
 *           default: this_week
 *         description: Timeframe filter for analytics data
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProviderAnalyticsResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /analytics/support:
 *   get:
 *     tags: [Analytics]
 *     summary: Get Support Dashboard Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [today, this_week, this_month, all_time]
 *           default: this_week
 *         description: Timeframe filter for analytics data
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportAnalyticsResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
