/**
 * @swagger
 * tags:
 *   - name: RBAC
 *     description: Role-based access control management endpoints (ADMIN)
 *   - name: RBAC Check
 *     description: Authenticated permission checks
 */

/**
 * @swagger
 * /rbac/check:
 *   get:
 *     summary: Check whether current user has a permission
 *     tags: [RBAC Check]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: permission
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission check completed
 */

/**
 * @swagger
 * /admin/rbac/roles:
 *   get:
 *     summary: List roles (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved
 *   post:
 *     summary: Create role (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slug, name]
 *             properties:
 *               slug:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role created
 */

/**
 * @swagger
 * /admin/rbac/roles/{roleId}:
 *   get:
 *     summary: Get role details (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role retrieved
 *   patch:
 *     summary: Update role (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated
 *   delete:
 *     summary: Delete role (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted
 */

/**
 * @swagger
 * /admin/rbac/permissions:
 *   get:
 *     summary: List permissions (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved
 *   post:
 *     summary: Create permission (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission created
 */

/**
 * @swagger
 * /admin/rbac/permissions/{permissionId}:
 *   patch:
 *     summary: Update permission (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission updated
 *   delete:
 *     summary: Delete permission (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission deleted
 */

/**
 * @swagger
 * /admin/rbac/roles/{roleId}/permissions/{permissionId}:
 *   post:
 *     summary: Assign permission to role (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission assigned
 *   delete:
 *     summary: Remove permission from role (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission removed
 */

/**
 * @swagger
 * /admin/rbac/roles/{roleId}/permissions:
 *   put:
 *     summary: Replace role permissions (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissionIds]
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Role permissions updated
 */

/**
 * @swagger
 * /admin/rbac/users/{userId}/roles:
 *   get:
 *     summary: Get active roles for user (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User roles retrieved
 *   post:
 *     summary: Assign role to user (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleId]
 *             properties:
 *               roleId:
 *                 type: string
 *               scopeType:
 *                 type: string
 *               scopeId:
 *                 type: string
 *                 nullable: true
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Role assigned
 */

/**
 * @swagger
 * /admin/rbac/users/{userId}/roles/{roleId}:
 *   delete:
 *     summary: Revoke role from user (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role revoked
 */

/**
 * @swagger
 * /admin/rbac/users/{userId}/permissions:
 *   get:
 *     summary: Get effective permissions for user (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User permissions retrieved
 *   post:
 *     summary: Grant or deny user permission override (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissionId, allowed]
 *             properties:
 *               permissionId:
 *                 type: string
 *               allowed:
 *                 type: boolean
 *               scopeType:
 *                 type: string
 *               scopeId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Permission override saved
 */

/**
 * @swagger
 * /admin/rbac/users/{userId}/permissions/{permissionId}:
 *   delete:
 *     summary: Remove user permission override (ADMIN)
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission override removed
 */
