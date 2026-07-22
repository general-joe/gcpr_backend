/**
 * @swagger
 * tags:
 *   - name: Consent
 *     description: Caregiver consent records controlling clinical data access.
 *
 * /consent:
 *   post:
 *     summary: Grant caregiver consent for a patient
 *     tags: [Consent]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Creates a consent record for treatment, data sharing, recording, photo/video, or research.
 *       The authenticated user must be the patient's caregiver or an admin. Provider access checks
 *       can use active TREATMENT or DATA_SHARING consent where scope is null, ALL_PROVIDERS,
 *       a provider id, PROVIDER:{providerId}, or a string containing the provider id.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, consentType]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               consentType:
 *                 type: string
 *                 enum: [TREATMENT, DATA_SHARING, RECORDING, PHOTO_VIDEO, RESEARCH]
 *               scope:
 *                 type: string
 *                 nullable: true
 *                 description: "Optional consent scope. Examples: ALL_PROVIDERS, provider UUID, PROVIDER:{providerId}."
 *               documentId:
 *                 type: string
 *                 nullable: true
 *               method:
 *                 type: string
 *                 enum: [DIGITAL_SIGNATURE, SMS, PAPER]
 *           example:
 *             patientId: 8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa
 *             consentType: DATA_SHARING
 *             scope: ALL_PROVIDERS
 *             method: DIGITAL_SIGNATURE
 *     responses:
 *       201:
 *         description: Consent created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only caregiver owner or admin can grant consent
 *   get:
 *     summary: List active consents for a patient
 *     tags: [Consent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Active consent records
 *       403:
 *         description: Patient access denied
 *
 * /consent/{consentId}/revoke:
 *   patch:
 *     summary: Revoke a consent record
 *     tags: [Consent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Consent revoked
 *       403:
 *         description: Only consent grantor or admin can revoke consent
 *       404:
 *         description: Consent record not found
 */
