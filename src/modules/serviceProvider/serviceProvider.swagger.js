/**
 * @openapi
 * components:
 *   schemas:
 *     ServiceProviderProfile:
 *       type: object
 *       required:
 *         - licenseDetails
 *         - licenseNumber
 *         - licenseExpiry
 *         - licenseIssuedDate
 *         - licenseType
 *         - profession
 *         - facilityType
 *         - facilityName
 *         - facilityAddress
 *         - experience
 *       properties:
 *         licenseDetails:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 1
 *
 *         licenseNumber:
 *           type: string
 *
 *         licenseImage:
 *           type: string
 *           nullable: true
 *
 *         licenseIssuedBy:
 *           type: string
 *           nullable: true
 *
 *         licenseExpiry:
 *           type: string
 *           format: date-time
 *
 *         licenseIssuedDate:
 *           type: string
 *           format: date-time
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceProviderProfile'
 *     responses:
 *       '201':
 *         description: Service provider profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceProviderProfile'
 *       '400':
 *         description: Validation error
 *       '500':
 *         description: Internal server error
 */
