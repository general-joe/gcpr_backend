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
 *     summary: Create a telehealth room
 *     description: Providers and admins create a Google Meet room and invite attendees by userId, email, or phone. Backend sends push/SMS/in-app invites automatically.
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
 *                 minLength: 3
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
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
 *                 minimum: 2
 *                 maximum: 500
 *               providerId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional. Set by admin when creating on behalf of a provider.
 *               attendees:
 *                 type: array
 *                 description: List of attendees. At least one identifier is required per entry. Backend looks up users by userId or email or phone and sends the Google Meet link via push, SMS, or in-app notification depending on what is available.
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                       format: email
 *                     phone:
 *                       type: string
 *                       description: Phone number in international format e.g. +15551234567
 *               patientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 deprecated: true
 *                 description: Legacy field. Use attendees instead.
 *     responses:
 *       200:
 *         description: Room created. Returns full room with participants and joinUrl.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [scheduled, live, completed, canceled, rescheduled]
 *                     joinUrl:
 *                       type: string
 *                       format: uri
 *                     scheduledStart:
 *                       type: string
 *                       format: date-time
 *                     scheduledEnd:
 *                       type: string
 *                       format: date-time
 *                     isRecordingEnabled:
 *                       type: boolean
 *                     participants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           userId:
 *                             type: string
 *                           role:
 *                             type: string
 *                             enum: [provider, caregiver, observer]
 *                           status:
 *                             type: string
 *                             enum: [invited, accepted, joined, declined]
 *   get:
 *     summary: List telehealth rooms for authenticated user
 *     description: Returns only rooms the logged-in user belongs to (as creator or participant). Admins see all rooms.
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
 *         description: Rooms retrieved successfully
 */

/**
 * @swagger
 * /telehealth/rooms/{id}:
 *   get:
 *     summary: Get telehealth room by ID
 *     description: Returns room details if the user is a participant or creator.
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
 *       403:
 *         description: User is not a participant in this room
 *   patch:
 *     summary: Update telehealth room (creator SERVICE_PROVIDER only)
 *     description: Reschedules the room and updates the linked Google Calendar event. Reminders are rebuilt automatically.
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
 *     description: Cancels the Google Meet link, deletes the Calendar event, and sets room status to canceled.
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
 *     description: Accepts attendees by userId, email, or phone. Backend sends the Google Meet link via in-app notification, FCM push (if user has active tokens), and SMS (if phone is provided and no app account exists). Each invitation is stored in TelehealthInvitation for audit.
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
 *             required: [attendees]
 *             properties:
 *               attendees:
 *                 type: array
 *                 description: One or more attendees. At least one identifier per entry.
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                       format: email
 *                     phone:
 *                       type: string
 *                       description: Phone in international format, e.g. +15551234567
 *     responses:
 *       200:
 *         description: Users invited successfully
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/participants:
 *   get:
 *     summary: Get room participants (SERVICE_PROVIDER only)
 *     description: Returns a list of all participants with their name, email/phone, and role in this room.
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
 *         description: Participants retrieved successfully
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/join:
 *   post:
 *     summary: Join a telehealth room
 *     description: Records the user's attendance and returns the Google Meet joinUrl. Open the URL in a WebView or external browser.
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
 *         description: Joined room successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     joinUrl:
 *                       type: string
 *                       format: uri
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/countdown:
 *   get:
 *     summary: Get telehealth room countdown
 *     description: Returns time remaining until the session starts. Automatically switches to LIVE when within 2 hours of start time.
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
 *         description: Countdown retrieved successfully
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/status:
 *   patch:
 *     summary: Update room status (SERVICE_PROVIDER only)
 *     description: Transition room between states: scheduled → live → completed / canceled. FCM push and SMS notifications are sent when status goes live. Invalid transitions return 400.
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
 *                 enum: [scheduled, live, completed, canceled, rescheduled]
 *     responses:
 *       200:
 *         description: Status updated
 */
