/**
 * @swagger
 * /schedule-appointment/available-providers:
 *   get:
 *     summary: Fetch service providers available for a specific date and time
 *     tags: [Schedule Appointment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-03-10
 *       - in: query
 *         name: time
 *         required: true
 *         schema:
 *           type: string
 *         example: "10:30"
 *     responses:
 *       200:
 *         description: Available providers fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: SUCCESS
 *               data:
 *                 date: 2026-03-10
 *                 time: "10:30"
 *                 total: 1
 *                 providers:
 *                   - id: 2f39fb95-68bc-4551-ad49-cea239d18980
 *                     profession: PHYSIOTHERAPIST
 *                     facilityName: New Hope Rehab Center
 *                     facilityAddress: East Legon
 *                     user:
 *                       id: 87ea3e90-f1a5-41d0-84b8-0abed8e77c99
 *                       fullName: Jane Doe
 *                       phoneNumber: "+233201234567"
 *                       email: janedoe@example.com
 *               message: Available providers fetched successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (CAREGIVER only)
 *
 * /schedule-appointment:
 *   post:
 *     summary: Schedule appointment with a service provider
 *     tags: [Schedule Appointment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, providerId, appointmentDate, reason]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               providerId:
 *                 type: string
 *                 format: uuid
 *               appointmentDate:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *           example:
 *             patientId: f4f08ec9-11e4-4f15-8bc0-45d61653f3e0
 *             providerId: 2f39fb95-68bc-4551-ad49-cea239d18980
 *             appointmentDate: "2026-03-10T10:30:00.000Z"
 *             reason: Follow-up consultation for therapy progress
 *     responses:
 *       200:
 *         description: Appointment scheduled successfully
 *         content:
 *           application/json:
 *             example:
 *               status: SUCCESS
 *               data:
 *                 id: 80d9a116-91dd-4141-b70f-d00933e8f71b
 *                 patientId: f4f08ec9-11e4-4f15-8bc0-45d61653f3e0
 *                 providerId: 2f39fb95-68bc-4551-ad49-cea239d18980
 *                 appointmentDate: "2026-03-10T10:30:00.000Z"
 *                 reason: Follow-up consultation for therapy progress
 *                 status: PENDING
 *               message: Appointment scheduled successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (CAREGIVER only)
 *       404:
 *         description: Patient or provider not found
 *       409:
 *         description: Provider already has a conflicting appointment
 *       422:
 *         description: Provider is not available at selected date and time
 */
