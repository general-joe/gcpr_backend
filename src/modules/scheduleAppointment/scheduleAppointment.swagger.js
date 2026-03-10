/**
 * @swagger
 * tags:
 *   name: Schedule Appointment
 *   description: Endpoints for caregivers to view available providers and schedule appointments
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         statusCode:
 *           type: integer
 *           example: 400
 *         message:
 *           type: string
 *           example: "Invalid date or time"
 *
 *     AvailableProvidersResponse:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           example: "2026-03-10"
 *         time:
 *           type: string
 *           example: "10:30"
 *         total:
 *           type: integer
 *           example: 3
 *         providers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               profession:
 *                 type: string
 *                 example: "PHYSIOTHERAPIST"
 *               facilityName:
 *                 type: string
 *                 example: "New Hope Rehab Center"
 *               facilityAddress:
 *                 type: string
 *                 example: "East Legon, Accra"
 *               user:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   fullName:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   email:
 *                     type: string
 *
 *     AppointmentResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *           format: uuid
 *         providerId:
 *           type: string
 *           format: uuid
 *         appointmentDate:
 *           type: string
 *           format: date-time
 *         reasonText:
 *           type: string
 *         reasonAudio:
 *           type: string
 *           description: URL to the recorded audio reason
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, DECLINED, COMPLETED, RESCHEDULED]
 *         patient:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             fullName:
 *               type: string
 *         provider:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             profession:
 *               type: string
 *             facilityName:
 *               type: string
 *             facilityAddress:
 *               type: string
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 fullName:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 email:
 *                   type: string
 *
 *     ProviderAvailabilityResponse:
 *       type: object
 *       properties:
 *         providerId:
 *           type: string
 *           format: uuid
 *         date:
 *           type: string
 *           format: date
 *         message:
 *           type: string
 *           nullable: true
 *         slots:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               dayOfWeek:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 6
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "17:00"
 */

/**
 * @swagger
 * /schedule-appointment/available-providers:
 *   get:
 *     summary: Get list of service providers available at a specific date and time
 *     description: Returns providers who are available on the given day of week and have no conflicting appointment at the exact datetime.
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
 *         description: Appointment date (YYYY-MM-DD)
 *         example: "2026-03-10"
 *       - in: query
 *         name: time
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *         description: Time in 24-hour format (HH:MM)
 *         example: "10:30"
 *     responses:
 *       200:
 *         description: Successfully retrieved available providers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvailableProvidersResponse'
 *       400:
 *         description: Invalid date or time format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       403:
 *         description: Forbidden – user is not a registered caregiver
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /schedule-appointment:
 *   post:
 *     summary: Create a new appointment for a patient with a service provider
 *     description: Only caregivers can schedule appointments for their associated patients. Validates availability and no conflicts.
 *     tags: [Schedule Appointment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - providerId
 *               - appointmentDate
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the patient (must belong to the authenticated caregiver)
 *               providerId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the selected service provider
 *               appointmentDate:
 *                 type: string
 *                 format: date-time
 *                 description: Full ISO datetime of the appointment
 *                 example: "2026-03-10T10:30:00.000Z"
 *               reasonText:
 *                 type: string
 *                 description: Reason for the appointment/visit
 *                 example: "Follow-up consultation for therapy progress"
 *               reasonAudio:
 *                 type: string
 *                 description: URL to the recorded audio reason
 *                 example: "https://example.com/audio/appointment-reason.m4a"
 *           example:
 *             patientId: "b1f4e9e4-3b8b-4e7b-9c55-5b5c8c7a1e22"
 *             providerId: "6a2d2e7f-91c8-4a62-9b75-0f9b0b2c3c44"
 *             appointmentDate: "2026-03-10T10:30:00.000Z"
 *             reasonText: "Follow-up consultation for therapy progress"
 *             reasonAudio: "https://example.com/audio/appointment-reason.m4a"
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentResponse'
 *       400:
 *         description: Invalid input (e.g. malformed date)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – not the caregiver of this patient
 *       404:
 *         description: Patient or provider not found
 *       409:
 *         description: Provider already has an appointment at this exact time
 *       422:
 *         description: Provider not available at the requested date/time
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /schedule-appointment/provider-availability:
 *   get:
 *     summary: Get availability slots for a specific provider on a given date
 *     description: Returns all availability slots defined for the provider on the requested day of week.
 *     tags: [Schedule Appointment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the service provider
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check availability for (YYYY-MM-DD)
 *         example: "2026-03-10"
 *     responses:
 *       200:
 *         description: Provider availability slots retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProviderAvailabilityResponse'
 *       400:
 *         description: Invalid date or providerId format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Provider not found (if no availabilities exist, still returns empty slots array)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /schedule-appointment/provider:
 *   get:
 *     summary: Get appointments for the authenticated service provider
 *     tags: [Schedule Appointment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter appointments by date (YYYY-MM-DD)
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter appointments by month (YYYY-MM)
 *     responses:
 *       200:
 *         description: Provider appointments fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AppointmentResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /schedule-appointment/caregiver:
 *   get:
 *     summary: Get appointments for the authenticated caregiver
 *     tags: [Schedule Appointment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter appointments by date (YYYY-MM-DD)
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter appointments by month (YYYY-MM)
 *     responses:
 *       200:
 *         description: Caregiver appointments fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AppointmentResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
