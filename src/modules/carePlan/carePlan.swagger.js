/**
 * @swagger
 * tags:
 *   - name: Care Plan
 *     description: Patient care plans generated from approved clinical assessments.
 *
 * /care-plan/generate/{assessmentId}:
 *   post:
 *     summary: Generate an active care plan from an approved assessment
 *     tags: [Care Plan]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Generates a care plan from an APPROVED assessment. The service uses the latest assessment
 *       report recommendations as initial goals/interventions, sets a default 12-week review date,
 *       and notifies the caregiver. Only service providers/admins can generate care plans.
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Care plan generated
 *       400:
 *         description: Assessment is not approved or active care plan already exists
 *       403:
 *         description: SERVICE_PROVIDER or ADMIN required
 *       404:
 *         description: Assessment not found
 *
 * /care-plan:
 *   get:
 *     summary: Get latest active care plan for a patient
 *     tags: [Care Plan]
 *     security:
 *       - bearerAuth: []
 *     description: Caregivers, providers, and admins can read care plans when patient access is allowed. Reads are audit logged as clinical record access.
 *     parameters:
 *       - in: query
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Active care plan
 *       403:
 *         description: Patient access denied
 *       404:
 *         description: Care plan not found
 *
 * /care-plan/list:
 *   get:
 *     summary: List care plans
 *     tags: [Care Plan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Care plan list
 *
 * /care-plan/{carePlanId}/status:
 *   patch:
 *     summary: Update care plan status
 *     tags: [Care Plan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carePlanId
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
 *                 enum: [ACTIVE, COMPLETED, SUPERSEDED]
 *     responses:
 *       200:
 *         description: Care plan status updated
 *
 * /care-plan/{carePlanId}/content:
 *   patch:
 *     summary: Update care plan goals, interventions, or review date
 *     tags: [Care Plan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carePlanId
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
 *             properties:
 *               goals:
 *                 type: array
 *                 items: {}
 *               interventions:
 *                 type: array
 *                 items: {}
 *               reviewDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Care plan content updated
 */
