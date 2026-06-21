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
 *     description: |
 *       Providers and admins create a telehealth room with optional Google Meet integration.
 *       The entire room creation (room + creator participant + invitations) is wrapped in a
 *       database transaction for atomicity — if any step fails, everything rolls back.
 *
 *       Google Meet creation is non-critical: if it fails, the room is still created with
 *       the error stored in `metadata.providerError`. The room remains fully usable.
 *
 *       Invitations send exactly ONE in-app notification per user (via NotificationService).
 *       Push notifications are handled by NotificationService.createNotification internally.
 *       No duplicate push notifications are sent. SMS is sent only for external invitees
 *       (phone without email/app account).
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
 *                 description: |
 *                   List of attendees. At least one identifier is required per entry.
 *                   Backend looks up users by userId, email, or phone and sends the
 *                   Google Meet link via in-app notification (push handled by NotificationService).
 *                   Duplicate detection prevents multiple invitations/participants for the same user.
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
 *         description: |
 *           Room created successfully. Returns full room with participants.
 *           If Google Meet creation failed, `metadata.providerError` will contain the error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [scheduled, live, completed, canceled, rescheduled]
 *                     joinUrl:
 *                       type: string
 *                       format: uri
 *                       nullable: true
 *                     scheduledStart:
 *                       type: string
 *                       format: date-time
 *                     scheduledEnd:
 *                       type: string
 *                       format: date-time
 *                     visibility:
 *                       type: string
 *                       enum: [private, organization, public]
 *                     maxParticipants:
 *                       type: integer
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         reminders:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               at:
 *                                 type: string
 *                                 format: date-time
 *                               sent:
 *                                 type: boolean
 *                               type:
 *                                 type: string
 *                                 enum: [1_HOUR, 15_MIN]
 *                         providerError:
 *                           type: string
 *                           nullable: true
 *                     participants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           userId:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [invited, accepted, joined, left, declined, kicked, failed]
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               fullName:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *                                 nullable: true
 *       400:
 *         description: Validation error or invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user is not a provider or admin
 *       500:
 *         description: |
 *           Database operation failed. The transaction ensures no partial commits.
 *           Error response includes `code` (Prisma error code) and `errorId` for tracing.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 code:
 *                   type: string
 *                   example: P2002
 *                 message:
 *                   type: string
 *                   example: A record with this value already exists
 *                 meta:
 *                   type: object
 *                 errorId:
 *                   type: string
 *   get:
 *     summary: List telehealth rooms for authenticated user
 *     description: |
 *       Returns only rooms the logged-in user belongs to (as creator or participant).
 *       Admins see all rooms. Soft-deleted rooms (deletedAt set) are excluded from results.
 *     tags: [Telehealth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [upcoming, past]
 *         description: Filter by upcoming (scheduled/live/rescheduled) or past (completed/canceled)
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
 *         description: Rooms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */

/**
 * @swagger
 * /telehealth/rooms/{id}:
 *   get:
 *     summary: Get telehealth room by ID
 *     description: |
 *       Returns room details if the user is a participant or creator.
 *       Soft-deleted rooms return 404.
 *     tags: [Telehealth]
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
 *         description: Room retrieved
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
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     status:
 *                       type: string
 *                     joinUrl:
 *                       type: string
 *                       nullable: true
 *                     scheduledStart:
 *                       type: string
 *                       format: date-time
 *                     scheduledEnd:
 *                       type: string
 *                       format: date-time
 *                     participants:
 *                       type: array
 *                     countdown:
 *                       type: object
 *                       properties:
 *                         days:
 *                           type: integer
 *                         hours:
 *                           type: integer
 *                         minutes:
 *                           type: integer
 *                         seconds:
 *                           type: integer
 *                         isLive:
 *                           type: boolean
 *                         isPast:
 *                           type: boolean
 *       403:
 *         description: User is not a participant in this room
 *       404:
 *         description: Room not found or has been deleted
 *   patch:
 *     summary: Update telehealth room (creator SERVICE_PROVIDER only)
 *     description: |
 *       Reschedules the room and updates the linked Google Calendar event.
 *       Reminders are rebuilt automatically when scheduledStart changes.
 *       Google Calendar update failures are logged but do not block the room update.
 *     tags: [Telehealth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *       403:
 *         description: Only the creator can update this room
 *       404:
 *         description: Room not found
 *   delete:
 *     summary: Cancel telehealth room (creator SERVICE_PROVIDER only)
 *     description: |
 *       Cancels the room by setting status to "canceled" and recording canceledAt/canceledBy.
 *       Also cancels the linked Google Calendar event if one exists.
 *       Google Calendar cancellation failures are logged but do not block the room cancellation.
 *       This is NOT a soft delete — the room remains visible in past filters.
 *       Use DELETE /telehealth/rooms/{id}/force for soft deletion.
 *     tags: [Telehealth]
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
 *         description: Room canceled
 *       403:
 *         description: Only the creator can cancel this room
 *       404:
 *         description: Room not found
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/force:
 *   delete:
 *     summary: Soft-delete a telehealth room (creator SERVICE_PROVIDER only)
 *     description: |
 *       Permanently hides the room by setting `deletedAt` timestamp.
 *       Soft-deleted rooms are excluded from all queries (listRooms, getRoomById, reminder job).
 *       This is irreversible through the API — the room can only be restored via database.
 *       Use DELETE /telehealth/rooms/{id} for cancellation (room remains visible in past).
 *     tags: [Telehealth]
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
 *         description: Room soft-deleted successfully
 *       403:
 *         description: Only the creator can delete this room
 *       404:
 *         description: Room not found
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/invite:
 *   post:
 *     summary: Invite users to telehealth room (SERVICE_PROVIDER only)
 *     description: |
 *       Accepts attendees by userId, email, or phone.
 *       Backend sends the Google Meet link via in-app notification (push handled by
 *       NotificationService.createNotification internally). SMS is sent only if phone
 *       is provided and no app account exists.
 *
 *       Duplicate detection prevents multiple invitations for the same user.
 *       Each invitation is stored in TelehealthInvitation for audit.
 *     tags: [Telehealth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *       400:
 *         description: No valid attendees provided
 *       403:
 *         description: Only service providers can invite users
 *       404:
 *         description: Room not found
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/participants:
 *   get:
 *     summary: Get room participants (SERVICE_PROVIDER only)
 *     description: Returns a list of all participants with their name and role in this room.
 *     tags: [Telehealth]
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
 *         description: Participants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 participants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       status:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           fullName:
 *                             type: string
 *                           profileImage:
 *                             type: string
 *                             nullable: true
 *       404:
 *         description: Room not found
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/join:
 *   post:
 *     summary: Join a telehealth room
 *     description: |
 *       Records the user's attendance and returns the Google Meet joinUrl.
 *       Uses upsert to handle both new and returning participants.
 *       Canceled or soft-deleted rooms cannot be joined.
 *     tags: [Telehealth]
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
 *         description: Joined room successfully
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
 *                     joinUrl:
 *                       type: string
 *                       format: uri
 *                       nullable: true
 *                     room:
 *                       type: object
 *       400:
 *         description: Room has been canceled or deleted
 *       404:
 *         description: Room not found
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/countdown:
 *   get:
 *     summary: Get telehealth room countdown
 *     description: |
 *       Returns time remaining until the session starts.
 *       Automatically switches to LIVE when within 2 hours of start time.
 *       Returns isPast=true if session ended more than 2 hours ago.
 *     tags: [Telehealth]
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
 *         description: Countdown retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Room not found
 */

/**
 * @swagger
 * /telehealth/rooms/{id}/status:
 *   patch:
 *     summary: Update room status (SERVICE_PROVIDER only)
 *     description: |
 *       Transition room between states with validation:
 *       - scheduled → live, canceled, rescheduled
 *       - live → completed, canceled
 *       - completed → rescheduled
 *       - canceled → scheduled, rescheduled
 *       - rescheduled → scheduled, live, canceled
 *
 *       Invalid transitions return 400.
 *     tags: [Telehealth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Only service providers can update room status
 *       404:
 *         description: Room not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiError:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *         code:
 *           type: string
 *           description: Prisma error code (only for database errors)
 *         message:
 *           type: string
 *         meta:
 *           type: object
 *           description: Additional error metadata (only in non-production)
 *         errorId:
 *           type: string
 *           description: Unique error identifier for tracing
 *     TelehealthRoom:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         organizationId:
 *           type: string
 *         creatorUserId:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         scheduledStart:
 *           type: string
 *           format: date-time
 *         scheduledEnd:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [scheduled, live, completed, canceled, rescheduled]
 *         visibility:
 *           type: string
 *           enum: [private, organization, public]
 *         maxParticipants:
 *           type: integer
 *         joinUrl:
 *           type: string
 *           nullable: true
 *         metadata:
 *           type: object
 *           properties:
 *             reminders:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   at:
 *                     type: string
 *                     format: date-time
 *                   sent:
 *                     type: boolean
 *                   type:
 *                     type: string
 *                     enum: [1_HOUR, 15_MIN]
 *             providerError:
 *               type: string
 *               nullable: true
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         canceledAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         canceledBy:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */