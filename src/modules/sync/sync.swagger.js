/**
 * @swagger
 * /sync/push:
 *   post:
 *     summary: Push a batch of offline-queued operations in client order (tickets, replies, adherence, messages, community, tasks, appointments)
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Called by the app as soon as connectivity returns. Accepts up to 50
 *       operations per batch (rate-limited to 60 pushes per 5 minutes) and
 *       processes them sequentially in the order the client generated them,
 *       so an offline sequence resolves deterministically rather than racing.
 *       Idempotency is per (user, clientId) via a 90-day idempotency record:
 *       retrying a batch after a dropped response returns the original result
 *       with duplicate=true instead of double-applying, while a replay after
 *       TTL expiry re-executes as a new op. Each operation
 *       carries a stable client-generated clientId; ticket replies may
 *       reference an offline-created ticket in the same batch via
 *       clientTicketId. Results are per-operation, so the client retries only
 *       the failed ops. Adherence conflicts resolve by server arrival order
 *       with conflicted=true flagged for provider review (both attempts stay
 *       in history); future logDates are rejected so a wrong device clock
 *       cannot win. Referral transitions and care-plan generation are
 *       online-only and not sync-eligible.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [operations]
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: Stable device identifier for audit purposes.
 *               operations:
 *                 type: array
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required: [clientId, type, data]
 *                   properties:
 *                     clientId:
 *                       type: string
 *                       description: Client-generated stable id (uuid). Retries reuse it for dedupe.
 *                     type:
 *                       type: string
 *                       enum: [support_ticket, ticket_message, adherence_log, direct_message, community_message, task_day_done, appointment_request]
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Client-claimed creation time (informational; server time breaks ties).
 *                     data:
 *                       type: object
 *                       description: >
 *                         support_ticket: {category, subject, description, priority?, attachments?}.
 *                         ticket_message: {ticketId? | clientTicketId?, content}.
 *                         adherence_log: {taskId, logDate, status?, notes?}.
 *                         direct_message: {receiverId, content?, mediaUrl?, type?, caption?}.
 *                         community_message: {groupId, content?, type?, mediaUrl?, replyToId?, caption?}.
 *                         task_day_done: {patientId, taskId, date?} (same checks as the days/done endpoint).
 *                         appointment_request: {patientId, providerId, appointmentDate, reasonText?, reasonAudio?}
 *                         (same slot validation as online booking; conflicts fail per-op).
 *     responses:
 *       200:
 *         description: Sync completed with per-operation results.
 */
