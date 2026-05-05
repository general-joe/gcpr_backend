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
 *     summary: Create a telehealth room (SP only)
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
 *     responses:
 *       200:
 *         description: Room created
 *   get:
 *     summary: List telehealth rooms
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
 *         description: List of rooms
 */
