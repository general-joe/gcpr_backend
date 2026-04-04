/**
 * @openapi
 * tags:
 *   - name: Notification
 *     description: In-app notification and push token management
 *
 * /notification:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *           default: "false"
 *         description: Filter to unread notifications only
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 *
 * /notification/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *
 * /notification/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 *
 * /notification/push-token:
 *   get:
 *     summary: Get user's push notification token
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Push token retrieved successfully
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Register or update push notification token
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Push notification token from device
 *               deviceType:
 *                 type: string
 *                 enum: [ios, android, web]
 *                 description: Type of device
 *               deviceId:
 *                 type: string
 *                 description: Device identifier
 *     responses:
 *       200:
 *         description: Push token registered successfully
 *       400:
 *         description: Token is required
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Remove push notification token
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Push token removed successfully
 *       401:
 *         description: Unauthorized
 *
 * /notification/{id}/read:
 *   put:
 *     summary: Mark a specific notification as read
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *
 * /notification/{id}/archive:
 *   put:
 *     summary: Archive a notification
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification archived
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *
 * /notification/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
