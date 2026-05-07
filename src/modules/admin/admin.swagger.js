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
