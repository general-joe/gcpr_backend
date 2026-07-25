/**
 * @swagger
 * tags:
 *   - name: Support Tickets
 *     description: User support ticket management
 *   - name: Admin Support
 *     description: Admin management of support tickets
 */

/**
 * @swagger
 * /support/tickets:
 *   post:
 *     summary: Create a support ticket
 *     tags: [Support Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, subject, description]
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [ACCOUNT, APPOINTMENT, TECHNICAL, BILLING, CAREGIVER_SUPPORT, PROVIDER_SUPPORT, OTHER]
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *     responses:
 *       200:
 *         description: Ticket created
 *   get:
 *     summary: List own support tickets
 *     tags: [Support Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, WAITING_ON_USER, RESOLVED, CLOSED]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [ACCOUNT, APPOINTMENT, TECHNICAL, BILLING, CAREGIVER_SUPPORT, PROVIDER_SUPPORT, OTHER]
 *     responses:
 *       200:
 *         description: Tickets retrieved
 */

/**
 * @swagger
 * /support/tickets/{ticketId}:
 *   get:
 *     summary: Get a support ticket by ID (owner only)
 *     tags: [Support Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket retrieved
 */

/**
 * @swagger
 * /support/tickets/{ticketId}/messages:
 *   get:
 *     summary: List messages for a support ticket (owner only)
 *     tags: [Support Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket messages retrieved
 *   post:
 *     summary: Add a reply to a ticket
 *     tags: [Support Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent
 */

/**
 * @swagger
 * /support/tickets/{ticketId}/close:
 *   patch:
 *     summary: Close a support ticket (owner only)
 *     tags: [Support Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket closed
 */

/**
 * @swagger
 * /admin/support/tickets:
 *   get:
 *     summary: List support tickets (admin)
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, WAITING_ON_USER, RESOLVED, CLOSED]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [ACCOUNT, APPOINTMENT, TECHNICAL, BILLING, CAREGIVER_SUPPORT, PROVIDER_SUPPORT, OTHER]
 *     responses:
 *       200:
 *         description: Tickets retrieved
 */

/**
 * @swagger
 * /admin/support/tickets/{ticketId}:
 *   get:
 *     summary: Get support ticket details (admin)
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket retrieved
 *   patch:
 *     summary: Update support ticket (admin)
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, IN_PROGRESS, WAITING_ON_USER, RESOLVED, CLOSED]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Ticket updated
 */

/**
 * @swagger
 * /admin/support/tickets/{ticketId}/messages:
 *   post:
 *     summary: Add admin reply to support ticket
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent
 */
