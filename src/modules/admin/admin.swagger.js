/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: |
 *     Admin-only endpoints for user, provider, and system management.
 *
 *     **Access**: Requires a valid JWT **and** the caller must have the `ADMIN`
 *     RBAC role assigned via the UserRole table (not a `userType` field).
 *     Use `POST /admin/bootstrap` to set up the initial ADMIN role assignment.
 */

/**
 * @swagger
 * /admin/bootstrap:
 *   post:
 *     summary: Bootstrap RBAC — seed default roles/permissions and assign the ADMIN role to a user
 *     tags: [Admin]
 *     description: |
 *       Seeds all default RBAC roles and permissions. Optionally assigns the ADMIN
 *       role to a specified user (must be a SERVICE_PROVIDER user).
 *
 *       **Authentication**: Protected by `BOOTSTRAP_SECRET` environment variable.
 *       Rate-limited to 5 requests per hour.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - secret
 *             properties:
 *               secret:
 *                 type: string
 *                 description: Must match the BOOTSTRAP_SECRET environment variable
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional. If provided, the ADMIN RBAC role is assigned to this user (must be SERVICE_PROVIDER).
 *     responses:
 *       200:
 *         description: Bootstrap completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 seed:
 *                   type: object
 *                   properties:
 *                     roles:
 *                       type: integer
 *                     permissions:
 *                       type: integer
 *                     rolePermissions:
 *                       type: integer
 *                 roleAssignment:
 *                   type: object
 *                   nullable: true
 *       403:
 *         description: Invalid or missing bootstrap secret
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /admin/rbac/seed:
 *   post:
 *     summary: Re-seed default RBAC roles and permissions (ADMIN only, idempotent)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: RBAC seeded successfully
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users (ADMIN RBAC role required)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [CAREGIVER, SERVICE_PROVIDER]
 *         description: Filter by user type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of users
 */
/**
 * @swagger
 * /admin/providers:
 *   get:
 *     summary: List all service providers pending verification (ADMIN RBAC role required)
 *     tags: [Admin]
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
 *           default: 20
 *     responses:
 *       200:
 *         description: List of service providers with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 */

/**
 * @swagger
 * /admin/providers/{id}:
 *   get:
 *     summary: Get detailed information about a service provider (ADMIN RBAC role required)
 *     tags: [Admin]
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
 *         description: Service provider details
 *       404:
 *         description: Service provider not found
 */

/**
 * @swagger
 * /admin/providers/{id}/verification:
 *   patch:
 *     summary: Approve, reject, or request changes for service provider verification (ADMIN RBAC role required)
 *     tags: [Admin]
 *     description: |
 *       Allows admins to manage service provider verification before the provider completes their profile.
 *
 *       **Supported Actions:**
 *       - **APPROVE**: Approves the verification and sets status to VERIFIED. Provider can now complete their profile.
 *       - **REJECT**: Rejects the verification. Verification status set to REJECTED.
 *       - **REQUEST_CHANGES**: Requests changes from the provider. Status remains PENDING_REVIEW.
 *       - **SUSPEND**: Suspends the provider's verification. Status set to SUSPENDED.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Service provider ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - verificationNote
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [APPROVE, REJECT, REQUEST_CHANGES, SUSPEND]
 *                 description: The verification action to perform
 *               verificationNote:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Notes or reason for the action (e.g., approval message, rejection reason, requested changes)
 *               licenseStatus:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 default: ACTIVE
 *                 description: License status (only used for APPROVE action)
 *     responses:
 *       200:
 *         description: Provider verification updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 verificationStatus:
 *                   type: string
 *                   enum: [PENDING_REVIEW, VERIFIED, REJECTED, SUSPENDED]
 *                 verificationNote:
 *                   type: string
 *                 verifiedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid action or missing required fields
 *       404:
 *         description: Service provider not found
 *       401:
 *         description: Unauthorized - ADMIN role required
 */
