/**
 * @swagger
 * tags:
 *   - name: Care Plan
 *     description: Patient care plans generated from approved clinical assessments.
 * components:
 *   schemas:
 *     CarePlanLinkedRehabTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         carePlanId:
 *           type: string
 *           format: uuid
 *           description: Links this rehab task back to the care plan.
 *         referralId:
 *           type: string
 *           format: uuid
 *           description: Referral that produced this task, when applicable.
 *         patientId:
 *           type: string
 *           format: uuid
 *         providerId:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         instructions:
 *           type: string
 *         instructionSteps:
 *           type: array
 *           items:
 *             type: string
 *         frequencyPerDay:
 *           type: integer
 *         frequencyNote:
 *           type: string
 *         durationDays:
 *           type: integer
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         videoUrl:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, ASSIGNED, COMPLETED]
 *         progress:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         caregiverMarkedDoneAt:
 *           type: string
 *           format: date-time
 *         completedDates:
 *           type: array
 *           items:
 *             type: string
 *     CarePlan:
 *       type: object
 *       description: Active clinical plan generated from an APPROVED assessment. Rehab tasks are linked through rehabTasks[].carePlanId.
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *           format: uuid
 *         assessmentId:
 *           type: string
 *           format: uuid
 *           description: Assessment that generated this care plan.
 *         primaryProviderId:
 *           type: string
 *           format: uuid
 *         reviewDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, SUPERSEDED]
 *         goals:
 *           type: array
 *           items: {}
 *           description: Initial goals, normally copied from latest assessment report recommendations.
 *         interventions:
 *           type: array
 *           items: {}
 *           description: Initial interventions, normally copied from latest assessment report recommendations.
 *         createdAt:
 *           type: string
 *           format: date-time
 *         patient:
 *           type: object
 *           additionalProperties: true
 *         primaryProvider:
 *           type: object
 *           additionalProperties: true
 *         assessment:
 *           type: object
 *           additionalProperties: true
 *         signatures:
 *           type: array
 *           items:
 *             type: object
 *             additionalProperties: true
 *         rehabTasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CarePlanLinkedRehabTask'
 *     CarePlanResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 200
 *         data:
 *           $ref: '#/components/schemas/CarePlan'
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
 *
 *       Linkage: ClinicalAssessment.id -> CarePlan.assessmentId -> RehabTask.carePlanId.
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarePlanResponse'
 *             example:
 *               status: 201
 *               data:
 *                 id: "d2af4a6d-7c2e-49a3-b3c4-3a3db59085d1"
 *                 patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *                 assessmentId: "a4f30fa7-2bc2-4415-bc3a-f6ca92be9492"
 *                 primaryProviderId: "2c3dc813-3df9-4cda-81b7-f39d80771f6a"
 *                 status: ACTIVE
 *                 goals:
 *                   - "Improve trunk control"
 *                 interventions:
 *                   - "Daily caregiver-supported sitting balance activity"
 *                 reviewDate: "2026-10-19T00:00:00.000Z"
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
 *     description: |
 *       Caregivers, providers, and admins can read care plans when patient access is allowed. Reads are audit logged as clinical record access.
 *       Mobile should use rehabTasks[] as the actionable task list for the caregiver. Games are separate patient-level assignments unless linked in a future task/game relation.
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarePlanResponse'
 *             example:
 *               status: 200
 *               data:
 *                 id: "d2af4a6d-7c2e-49a3-b3c4-3a3db59085d1"
 *                 patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *                 assessmentId: "a4f30fa7-2bc2-4415-bc3a-f6ca92be9492"
 *                 primaryProviderId: "2c3dc813-3df9-4cda-81b7-f39d80771f6a"
 *                 status: ACTIVE
 *                 goals:
 *                   - "Improve independent sitting tolerance"
 *                 interventions:
 *                   - "Daily trunk balance activity with caregiver support"
 *                 reviewDate: "2026-10-19T00:00:00.000Z"
 *                 rehabTasks:
 *                   - id: "7d7fd754-44a8-4b0d-8e7e-8079fb49c614"
 *                     carePlanId: "d2af4a6d-7c2e-49a3-b3c4-3a3db59085d1"
 *                     referralId: "fba615cf-9e38-4183-8e23-07ebc3e7e500"
 *                     patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *                     title: "Daily trunk balance training"
 *                     instructions: "Perform seated trunk reaches with caregiver support"
 *                     frequencyPerDay: 2
 *                     durationDays: 21
 *                     videoUrl: "https://www.youtube.com/watch?v=XXXXXXXXXXX"
 *                     status: ASSIGNED
 *                     progress: 0
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CarePlan'
 *
 * /care-plan/{carePlanId}:
 *   patch:
 *     summary: Update care plan status, goals, interventions, or review date
 *     tags: [Care Plan]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Updates one or more care plan fields in a single request. Use this endpoint for both lifecycle changes and clinical content updates.
 *       Caregivers should not call this endpoint; they should only read care plans and complete assigned tasks.
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
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, COMPLETED, SUPERSEDED]
 *                 description: |
 *                   ACTIVE - current care plan the patient/caregiver should follow.
 *                   COMPLETED - care plan has been finished and is no longer the active plan.
 *                   SUPERSEDED - care plan was replaced by another/newer care plan.
 *               goals:
 *                 type: array
 *                 items: {}
 *                 description: Updated clinical goals.
 *               interventions:
 *                 type: array
 *                 items: {}
 *                 description: Updated clinical interventions.
 *               reviewDate:
 *                 type: string
 *                 format: date-time
 *                 description: Next care plan review date.
 *           examples:
 *             updateStatus:
 *               summary: Update status only
 *               value:
 *                 status: COMPLETED
 *             updateContent:
 *               summary: Update content only
 *               value:
 *                 goals:
 *                   - "Improve trunk control"
 *                   - "Increase assisted standing tolerance"
 *                 interventions:
 *                   - "Daily caregiver-supported sitting balance exercise"
 *                   - "Weekly provider review"
 *                 reviewDate: "2026-10-19T00:00:00.000Z"
 *             updateStatusAndContent:
 *               summary: Update status and content together
 *               value:
 *                 status: ACTIVE
 *                 goals:
 *                   - "Improve independent sitting tolerance"
 *                 interventions:
 *                   - "Daily trunk balance activity with caregiver support"
 *                 reviewDate: "2026-10-19T00:00:00.000Z"
 *     responses:
 *       200:
 *         description: Care plan updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarePlanResponse'
 */
