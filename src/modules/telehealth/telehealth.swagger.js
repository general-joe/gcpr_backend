/**
 * @swagger
 * tags:
 *   name: Telehealth
 *   description: Telehealth room management via Google Meet
 */

/**
 * @swagger
 * /telehealth/rooms:
 *   post:
 *     summary: Create a telehealth room (SERVICE_PROVIDER only)
 *     tags: [Telehealth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, scheduledStart, scheduledEnd]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               scheduledStart:
 *                 type: string
 *                 format: date-time
 *               scheduledEnd:
 *                 type: string
 *                 format: date-time
 *               visibility:
 *                 type: string
 *                 enum: [private, organization, public]
 *               maxParticipants:
 *                 type: integer
 *               patientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Room created
 *   get:
 *     summary: List telehealth rooms for authenticated user
 *     tags: [Telehealth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [upcoming, past]
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
 *         description: Rooms retrieved
 */

/**
 * @swagger
 * /telehealth/rooms/{id}:
 *   get:
 *     summary: Get telehealth room by ID
 *     tags: [Telehealth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room retrieved
 *   patch:
 *     summary: Update telehealth room (creator SERVICE_PROVIDER only)
 *     tags: [Telehealth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               scheduledStart:
 *                 type: string
 *                 format: date-time
 *               scheduledEnd:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Room updated
 *   delete:
 *     summary: Cancel telehealth room (creator SERVICE_PROVIDER only)
 *     tags: [Telehealth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room canceled
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/invite:
 *   post:
 *     summary: Invite users to telehealth room (SERVICE_PROVIDER only)
 *     tags: [Telehealth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userIds]
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Users invited
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/participants:
 *   get:
 *     summary: Get room participants (SERVICE_PROVIDER only)
 *     tags: [Telehealth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participants retrieved
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/join:
 *   post:
 *     summary: Join a telehealth room
 *     tags: [Telehealth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Joined room
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/countdown:
 *   get:
 *     summary: Get telehealth room countdown
 *     tags: [Telehealth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Countdown retrieved
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/status:
 *   patch:
 *     summary: Update room status (SERVICE_PROVIDER only)
 *     tags: [Telehealth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [scheduled, live, completed, canceled]
 *     responses:
 *       200:
 *         description: Status updated
 */
