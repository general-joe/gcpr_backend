/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Mobile-optimized dashboard endpoints for caregivers and service providers.
 *
 * /dashboard/caregiver:
 *   get:
 *     summary: Get caregiver mobile dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns the caregiver's mobile home-screen data in one request: linked CP patients,
 *       today's active rehab tasks, upcoming appointments, and
 *       resources prescribed by providers. This endpoint is intended to reduce mobile app
 *       round trips after login.
 *     responses:
 *       200:
 *         description: Caregiver dashboard retrieved successfully
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
 *                     patients:
 *                       type: array
 *                       items:
 *                         type: object
 *                     todayTasks:
 *                       type: array
 *                       items:
 *                         type: object
 *                     upcomingAppointments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     prescribedResources:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: CAREGIVER account required
 *       404:
 *         description: Caregiver profile not found
 *
 * /dashboard/provider:
 *   get:
 *     summary: Get service provider dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns the provider's operational home-screen data: today's appointments,
 *       pending referrals targeted to the provider or their profession, active rehab tasks,
 *       and active rehab tasks.
 *     responses:
 *       200:
 *         description: Provider dashboard retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: SERVICE_PROVIDER account required
 *       404:
 *         description: Service provider profile not found
 */
