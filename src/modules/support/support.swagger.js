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
 */

/**
 * @swagger
 * /support/tickets/{ticketId}/messages:
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
