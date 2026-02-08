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

/**
 * @openapi
 * /service-provider:
 *   get:
 *     summary: Get all service providers with pagination
 *     tags:
 *       - Service Providers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       '200':
 *         description: Service providers retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               status: SUCCESS
 *               data: Service providers retrieved successfully
 *               message:
 *                 data:
 *                   - id: d2b6574f-7356-4375-96ad-b72041bc6e68
 *                     userId: 56Xr6vWm0sL33sCW6amx
 *                     licenseNumber: "12341234"
 *                     licenseImage: "http://localhost:3000/licenses/56Xr6vWm0sL33sCW6amx.jpg"
 *                     licenseExpiry: "2030-04-11T00:00:00.000Z"
 *                     licenseIssuedBy: "gov"
 *                     licenseIssuedDate: "2005-03-09T00:00:00.000Z"
 *                     licenseType: "MDC"
 *                     licenseStatus: "INACTIVE"
 *                     profession: "GENERAL_PAEDIATRICIAN"
 *                     facilityType: "REGIONAL_HOSPITAL"
 *                     facilityName: "kukus"
 *                     facilityAddress: "kumasi"
 *                     licensePin: "54212303"
 *                     experience: 2
 *                     createdAt: "2026-02-06T10:20:33.615Z"
 *                     updatedAt: "2026-02-06T10:20:33.615Z"
 *                     user:
 *                       id: 56Xr6vWm0sL33sCW6amx
 *                       fullName: "Samuel Twum Boateng"
 *                       email: "samuelmanueljnr@gmail.com"
 *                       password: "$2b$12$Ak9/9.0a4x/BzPbONVkV8O31nmGkTOUO.6YYrBgKVSVxqWez073iK"
 *                       dateOfBirth: "2004-08-11T00:00:00.000Z"
 *                       address: null
 *                       digitalAddress: null
 *                       phoneNumber: "0541383756"
 *                       gender: "MALE"
 *                       role: "SERVICE_PROVIDER"
 *                       profileImage: "http://localhost:3000/profiles/56Xr6vWm0sL33sCW6amx.jpg"
 *                       createdAt: "2026-02-06T10:14:41.762Z"
 *                       updatedAt: "2026-02-06T10:20:33.659Z"
 *                       verified: true
 *                       profileCompleted: true
 *                 pagination:
 *                   total: 1
 *                   page: 1
 *                   limit: 10
 *                   pages: 1
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */

/**
 * @openapi
 * /service-provider/{id}:
 *   get:
 *     summary: Get a specific service provider by ID
 *     tags:
 *       - Service Providers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service provider ID
 *     responses:
 *       '200':
 *         description: Service provider retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               status: SUCCESS
 *               data: Service provider retrieved successfully
 *               message:
 *                 id: d2b6574f-7356-4375-96ad-b72041bc6e68
 *                 userId: 56Xr6vWm0sL33sCW6amx
 *                 licenseNumber: "12341234"
 *                 licenseImage: "http://localhost:3000/licenses/56Xr6vWm0sL33sCW6amx.jpg"
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
 *                 createdAt: "2026-02-06T10:20:33.615Z"
 *                 updatedAt: "2026-02-06T10:20:33.615Z"
 *                 user:
 *                   id: 56Xr6vWm0sL33sCW6amx
 *                   fullName: "Samuel Twum Boateng"
 *                   email: "samuelmanueljnr@gmail.com"
 *                   password: "$2b$12$Ak9/9.0a4x/BzPbONVkV8O31nmGkTOUO.6YYrBgKVSVxqWez073iK"
 *                   dateOfBirth: "2004-08-11T00:00:00.000Z"
 *                   address: null
 *                   digitalAddress: null
 *                   phoneNumber: "0541383756"
 *                   gender: "MALE"
 *                   role: "SERVICE_PROVIDER"
 *                   profileImage: "http://localhost:3000/profiles/56Xr6vWm0sL33sCW6amx.jpg"
 *                   createdAt: "2026-02-06T10:14:41.762Z"
 *                   updatedAt: "2026-02-06T10:20:33.659Z"
 *                   verified: true
 *                   profileCompleted: true
 *       '404':
 *         description: Service provider not found
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */

/**
 * @openapi
 * /service-provider/search:
 *   get:
 *     summary: Search service providers with filters
 *     tags:
 *       - Service Providers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term (license number, profession, facility name, etc.)
 *       - in: query
 *         name: licenseType
 *         schema:
 *           type: string
 *           enum: [AHPC, MDC, PHCG, PSCG]
 *         description: Filter by license type
 *       - in: query
 *         name: profession
 *         schema:
 *           type: string
 *         description: Filter by profession
 *       - in: query
 *         name: facilityType
 *         schema:
 *           type: string
 *         description: Filter by facility type
 *       - in: query
 *         name: licenseStatus
 *         schema:
 *           type: string
 *         description: Filter by license status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       '200':
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               status: SUCCESS
 *               data: Search results retrieved successfully
 *               message:
 *                 data:
 *                   - id: d2b6574f-7356-4375-96ad-b72041bc6e68
 *                     userId: 56Xr6vWm0sL33sCW6amx
 *                     licenseNumber: "12341234"
 *                     licenseImage: "http://localhost:3000/licenses/56Xr6vWm0sL33sCW6amx.jpg"
 *                     licenseExpiry: "2030-04-11T00:00:00.000Z"
 *                     licenseIssuedBy: "gov"
 *                     licenseIssuedDate: "2005-03-09T00:00:00.000Z"
 *                     licenseType: "MDC"
 *                     licenseStatus: "INACTIVE"
 *                     profession: "GENERAL_PAEDIATRICIAN"
 *                     facilityType: "REGIONAL_HOSPITAL"
 *                     facilityName: "kukus"
 *                     facilityAddress: "kumasi"
 *                     licensePin: "54212303"
 *                     experience: 2
 *                     createdAt: "2026-02-06T10:20:33.615Z"
 *                     updatedAt: "2026-02-06T10:20:33.615Z"
 *                     user:
 *                       id: 56Xr6vWm0sL33sCW6amx
 *                       fullName: "Samuel Twum Boateng"
 *                       email: "samuelmanueljnr@gmail.com"
 *                       password: "$2b$12$Ak9/9.0a4x/BzPbONVkV8O31nmGkTOUO.6YYrBgKVSVxqWez073iK"
 *                       dateOfBirth: "2004-08-11T00:00:00.000Z"
 *                       address: null
 *                       digitalAddress: null
 *                       phoneNumber: "0541383756"
 *                       gender: "MALE"
 *                       role: "SERVICE_PROVIDER"
 *                       profileImage: "http://localhost:3000/profiles/56Xr6vWm0sL33sCW6amx.jpg"
 *                       createdAt: "2026-02-06T10:14:41.762Z"
 *                       updatedAt: "2026-02-06T10:20:33.659Z"
 *                       verified: true
 *                       profileCompleted: true
 *                 pagination:
 *                   total: 1
 *                   page: 1
 *                   limit: 10
 *                   pages: 1
 *       '400':
 *         description: Search term is required
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */

/**
 * @openapi
 * /service-provider/{id}:
 *   put:
 *     summary: Update a service provider
 *     tags:
 *       - Service Providers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service provider ID
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
 *       '200':
 *         description: Service provider updated successfully
 *         content:
 *           application/json:
 *             example:
 *               status: SUCCESS
 *               data: Service provider updated successfully
 *               message:
 *                 id: d2b6574f-7356-4375-96ad-b72041bc6e68
 *                 userId: 56Xr6vWm0sL33sCW6amx
 *                 licenseNumber: "12341234"
 *                 licenseImage: "http://localhost:3000/licenses/56Xr6vWm0sL33sCW6amx.jpg"
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
 *                 experience: 3
 *                 createdAt: "2026-02-06T10:20:33.615Z"
 *                 updatedAt: "2026-02-06T10:30:00.000Z"
 *                 user:
 *                   id: 56Xr6vWm0sL33sCW6amx
 *                   fullName: "Samuel Twum Boateng"
 *                   email: "samuelmanueljnr@gmail.com"
 *                   password: "$2b$12$Ak9/9.0a4x/BzPbONVkV8O31nmGkTOUO.6YYrBgKVSVxqWez073iK"
 *                   dateOfBirth: "2004-08-11T00:00:00.000Z"
 *                   address: null
 *                   digitalAddress: null
 *                   phoneNumber: "0541383756"
 *                   gender: "MALE"
 *                   role: "SERVICE_PROVIDER"
 *                   profileImage: "http://localhost:3000/profiles/56Xr6vWm0sL33sCW6amx.jpg"
 *                   createdAt: "2026-02-06T10:14:41.762Z"
 *                   updatedAt: "2026-02-06T10:30:00.000Z"
 *                   verified: true
 *                   profileCompleted: true
 *       '404':
 *         description: Service provider not found
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */

/**
 * @openapi
 * /service-provider/{id}:
 *   delete:
 *     summary: Delete a service provider
 *     tags:
 *       - Service Providers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service provider ID
 *     responses:
 *       '200':
 *         description: Service provider deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               status: SUCCESS
 *               data: Service provider deleted successfully
 *               message: null
 *       '404':
 *         description: Service provider not found
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
