/**
 * @openapi
 * components:
 *   schemas:
 *     ServiceProviderProfile:
 *       type: object
 *       required:
 *         - licensePin
 *         - licenseNumber
 *         - licenseExpiry
 *         - licenseIssuedDate
 *         - licenseType
 *         - profession
 *         - facilityType
 *         - facilityName
 *         - facilityAddress
 *         - experience
 *         - licenseImage
 *       properties:
 *         licensePin:
 *           type: string
 *           minLength: 8
 *           maxLength: 8
 *         licenseNumber:
 *           type: string
 *         licenseImage:
 *           type: string
 *           format: binary
 *         licenseIssuedBy:
 *           type: string
 *         licenseExpiry:
 *           type: string
 *           format: date
 *         licenseIssuedDate:
 *           type: string
 *           format: date
 *         licenseType:
 *           type: string
 *           enum: [AHPC, MDC, PHCG, PSCG]
 *         profession:
 *           type: string
 *           enum: [GENERAL_PAEDIATRICIAN, DEVELOPMENTAL_PAEDIATRICIAN, PAEDIATRIC_NEUROLOGIST, NEURODEVELOPMENTAL_PAEDIATRICIAN, REHABILITATION_PAEDIATRICIAN, PHYSIOTHERAPIST, OCCUPATIONAL_THERAPIST, SPEECH_THERAPIST, CLINICAL_PSYCHOLOGIST, DIETITIAN, PHARMACIST]
 *         facilityType:
 *           type: string
 *           enum: [TERTIARY_TEACHING_HOSPITAL, REGIONAL_HOSPITAL, SECONDARY_HEALTH_CARE, PRIMARY_HEALTHCARE, CP_HOME]
 *         facilityName:
 *           type: string
 *         facilityAddress:
 *           type: string
 *         experience:
 *           type: integer
 *           minimum: 0
 *
 * /service-provider/complete-profile:
 *   post:
 *     summary: Complete service provider profile
 *     tags: [Service Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ServiceProviderProfile'
 *     responses:
 *       200:
 *         description: Service provider profile completed
 *       400:
 *         description: Validation error or missing license image
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Profile already exists
 *
 * /service-provider:
 *   get:
 *     summary: Get service providers (paginated)
 *     tags: [Service Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Service providers retrieved successfully
 *       401:
 *         description: Unauthorized
 *
 * /service-provider/search:
 *   get:
 *     summary: Search service providers
 *     tags: [Service Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: licenseType
 *         schema:
 *           type: string
 *           enum: [AHPC, MDC, PHCG, PSCG]
 *       - in: query
 *         name: profession
 *         schema:
 *           type: string
 *       - in: query
 *         name: facilityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: licenseStatus
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Search term is required
 *
 * /service-provider/{id}:
 *   get:
 *     summary: Get one service provider by ID
 *     tags: [Service Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Service provider retrieved successfully
 *       404:
 *         description: Service provider not found
 *   put:
 *     summary: Update own service provider profile
 *     tags: [Service Providers]
 *     security:
 *       - bearerAuth: []
 *     description: Caller can update only profile matching own service provider ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               licensePin:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *               licenseImage:
 *                 type: string
 *                 format: binary
 *               licenseIssuedBy:
 *                 type: string
 *               licenseExpiry:
 *                 type: string
 *                 format: date
 *               licenseIssuedDate:
 *                 type: string
 *                 format: date
 *               licenseType:
 *                 type: string
 *                 enum: [AHPC, MDC, PHCG, PSCG]
 *               profession:
 *                 type: string
 *               facilityType:
 *                 type: string
 *               facilityName:
 *                 type: string
 *               facilityAddress:
 *                 type: string
 *               experience:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Service provider updated successfully
 *       403:
 *         description: Can only update own profile
 *       404:
 *         description: Service provider not found
 *   delete:
 *     summary: Delete own service provider profile
 *     tags: [Service Providers]
 *     security:
 *       - bearerAuth: []
 *     description: Caller can delete only profile matching own service provider ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Service provider deleted successfully
 *       403:
 *         description: Can only delete own profile
 *       404:
 *         description: Service provider not found
 *
 * /service-provider/{id}/availability:
 *   put:
 *     summary: Update service provider availability
 *     tags: [Service Providers]
 *     security:
 *       - bearerAuth: []
 *     description: Replace the availability slots for the specified service provider.
 *     parameters:
 *       - in: path
 *         name: id
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
 *             required:
 *               - availability
 *             properties:
 *               availability:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - dayOfWeek
 *                     - startTime
 *                     - endTime
 *                   properties:
 *                     dayOfWeek:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 6
 *                       description: Day of week (0=Sunday, 6=Saturday)
 *                     startTime:
 *                       type: string
 *                       pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$"
 *                       description: Start time in HH:mm format
 *                     endTime:
 *                       type: string
 *                       pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$"
 *                       description: End time in HH:mm format
 *     responses:
 *       200:
 *         description: Availability updated successfully
 *       400:
 *         description: Invalid input data or at least one availability slot is required
 *       403:
 *         description: Can only update own availability
 *       404:
 *         description: Service provider not found
 */
