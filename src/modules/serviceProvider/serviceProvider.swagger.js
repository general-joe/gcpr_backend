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
 *         licenseNumber:
 *           type: string
 *         licensePin:
 *           type: string
 *         licenseImage:
 *           type: string
 *           format: binary
 *
 *         licenseIssuedBy:
 *           type: string
 *           nullable: true
 *
 *         licenseExpiry:
 *           type: string
 *           format: date
 *
 *         licenseIssuedDate:
 *           type: string
 *           format: date
 *
 *         licenseType:
 *           type: string
 *           enum: [AHPC, MDC, PHCG, PSCG]
 *
 *         profession:
 *           type: string
 *           enum:
 *             - GENERAL_PAEDIATRICIAN
 *             - DEVELOPMENTAL_PAEDIATRICIAN
 *             - PAEDIATRIC_NEUROLOGIST
 *             - NEURODEVELOPMENTAL_PAEDIATRICIAN
 *             - REHABILITATION_PAEDIATRICIAN
 *             - PHYSIOTHERAPIST
 *             - OCCUPATIONAL_THERAPIST
 *             - SPEECH_THERAPIST
 *             - CLINICAL_PSYCHOLOGIST
 *             - DIETITIAN
 *             - PHARMACIST
 *
 *         facilityType:
 *           type: string
 *           enum:
 *             - TERTIARY_TEACHING_HOSPITAL
 *             - REGIONAL_HOSPITAL
 *             - SECONDARY_HEALTH_CARE
 *             - PRIMARY_HEALTHCARE
 *             - CP_HOME
 *
 *         facilityName:
 *           type: string
 *
 *         facilityAddress:
 *           type: string
 *
 *         experience:
 *           type: integer
 *           minimum: 0
 */

/**
 * @openapi
 * /service-provider/complete-profile:
 *   post:
 *     summary: Complete service provider profile
 *     tags:
 *       - Service Providers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ServiceProviderProfile'
 *     responses:
 *       '201':
 *         description: Service provider profile created successfully
 *         content:
 *           application/json:
 *             example:
 *               status: SUCCESS
 *               message: Service provider profile completed
 *               data:
 *                 id: b335fb7d-4c2d-4e17-9187-4cd3963cd477
 *                 userId: 02ELa6GTAXdfg7ESEsjF
 *                 licenseNumber: "12341234"
 *                 licenseImage: "http://localhost:3000/licenses/02ELa6GTAXdfg7ESEsjF.jpg"
 *                 licenseExpiry: "2030-04-11T00:00:00.000Z"
 *                 licenseIssuedBy: "gov"
 *                 licenseIssuedDate: "2005-03-09T00:00:00.000Z"
 *                 licenseType: "MDC"
 *                 licenseStatus: "INACTIVE"
 *                 profession: "GENERAL_PAEDIATRICIAN"
 *                 facilityType: "REGIONAL_HOSPITAL"
 *                 facilityName: "kukus"
 *                 facilityAddress: "kumasi"
 *                 licensePin: "54212303"
 *                 experience: 2
 *                 createdAt: "2026-02-02T20:42:31.223Z"
 *                 updatedAt: "2026-02-02T20:42:31.223Z"
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
