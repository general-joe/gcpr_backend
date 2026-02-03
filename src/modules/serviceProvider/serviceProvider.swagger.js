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
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
