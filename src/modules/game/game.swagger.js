/**
 * @swagger
 * tags:
 *   name: Game
 *   description: Built-in Cboard/CPC activity assignment and progress tracking
 * components:
 *   schemas:
 *     GameResource:
 *       type: object
 *       description: Built-in external activity. Mobile should open embedUrl or metadata.launchUrl in an in-app WebView.
 *       properties:
 *         id:
 *           type: string
 *           example: builtin-cboard-aac
 *         title:
 *           type: string
 *           example: Cboard AAC Communication Board
 *         description:
 *           type: string
 *         source:
 *           type: string
 *           example: EXTERNAL
 *         externalProvider:
 *           type: string
 *           example: cboard
 *         externalId:
 *           type: string
 *           example: cboard-aac
 *         files:
 *           type: array
 *           items:
 *             type: string
 *           example: ["https://app.cboard.io/"]
 *         thumbnail:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         metadata:
 *           type: object
 *           properties:
 *             builtIn:
 *               type: boolean
 *               example: true
 *             activityType:
 *               type: string
 *               example: AAC_COMMUNICATION
 *             launchUrl:
 *               type: string
 *               example: https://app.cboard.io/
 *             launchMode:
 *               type: string
 *               example: IN_APP_WEBVIEW
 *             shouldOpenExternally:
 *               type: boolean
 *               example: false
 *             selectableMetrics:
 *               type: array
 *               items:
 *                 type: string
 *               example: [communicationAttempts, successfulSelections, promptedSelections, symbolsUsed, frustrationEvents]
 *         embedUrl:
 *           type: string
 *           example: https://app.cboard.io/
 *     GameAssignment:
 *       type: object
 *       description: Patient-level game assignment stored as ActivityParticipationLog with activityCategory GAME_ASSIGNMENT.
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *           format: uuid
 *         providerId:
 *           type: string
 *           format: uuid
 *         activityName:
 *           type: string
 *         activityCategory:
 *           type: string
 *           example: GAME_ASSIGNMENT
 *         participatedOn:
 *           type: string
 *           format: date-time
 *         durationMinutes:
 *           type: integer
 *           example: 0
 *         outcome:
 *           type: string
 *           example: ASSIGNED
 *         metadata:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: GAME_ASSIGNMENT
 *             gameId:
 *               type: string
 *               example: builtin-cboard-aac
 *             source:
 *               type: string
 *               example: EXTERNAL
 *             externalProvider:
 *               type: string
 *               example: cboard
 *             launchUrl:
 *               type: string
 *               example: https://app.cboard.io/
 *             goals:
 *               type: array
 *               items:
 *                 type: string
 *             frequency:
 *               type: string
 *               example: 5 minutes daily
 *             dueDate:
 *               type: string
 *               format: date-time
 *             note:
 *               type: string
 *     GameParticipationLog:
 *       type: object
 *       description: Game session/stat log created by mobile or provider after play. Cboard/CPC do not automatically push stats to this backend.
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *           format: uuid
 *         providerId:
 *           type: string
 *           format: uuid
 *         activityName:
 *           type: string
 *         activityCategory:
 *           type: string
 *           example: GAME_PLAY
 *         participatedOn:
 *           type: string
 *           format: date-time
 *         durationMinutes:
 *           type: integer
 *         outcome:
 *           type: string
 *           enum: [COMPLETED, PARTIAL, SKIPPED, INTERRUPTED, REFUSED, CANCELLED]
 *           example: COMPLETED
 *         metadata:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: GAME_PLAY
 *             gameId:
 *               type: string
 *               example: builtin-cboard-aac
 *             metrics:
 *               type: object
 *               example:
 *                 communicationAttempts: 12
 *                 successfulSelections: 8
 *                 promptedSelections: 3
 *                 symbolsUsed: 6
 *                 frustrationEvents: 1
 *             note:
 *               type: string
 *     GameImprovementSummary:
 *       type: object
 *       properties:
 *         patientId:
 *           type: string
 *           format: uuid
 *         totalSessions:
 *           type: integer
 *         totalDurationMinutes:
 *           type: integer
 *         games:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *               activityName:
 *                 type: string
 *               sessions:
 *                 type: integer
 *               totalDurationMinutes:
 *                 type: integer
 *               firstSessionAt:
 *                 type: string
 *                 format: date-time
 *               lastSessionAt:
 *                 type: string
 *                 format: date-time
 *               metricChanges:
 *                 type: object
 *                 example:
 *                   communicationAttempts:
 *                     first: 5
 *                     last: 12
 *                     change: 7
 */

/**
 * @swagger
 * /game:
 *   get:
 *     summary: List built-in game/AAC activities
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [EXTERNAL]
 *       - in: query
 *         name: tag
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
 *         description: Built-in games retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GameResource'
 *                 pagination:
 *                   type: object
 *             example:
 *               status: SUCCESS
 *               data:
 *                 - id: builtin-cboard-aac
 *                   title: Cboard AAC Communication Board
 *                   source: EXTERNAL
 *                   externalProvider: cboard
 *                   files: ["https://app.cboard.io/"]
 *                   metadata:
 *                     launchUrl: https://app.cboard.io/
 *                     launchMode: IN_APP_WEBVIEW
 *                     selectableMetrics: [communicationAttempts, successfulSelections, promptedSelections, symbolsUsed, frustrationEvents]
 *                   embedUrl: https://app.cboard.io/
 *               pagination:
 *                 total: 12
 *                 page: 1
 *                 limit: 20
 *                 totalPages: 1
 *               message: Game resources retrieved successfully
 */

/**
 * @swagger
 * /game/selectable:
 *   get:
 *     summary: List selectable built-in Cboard and CPC activities
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Selectable built-in games retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GameResource'
 */

/**
 * @swagger
 * /game/{id}:
 *   get:
 *     summary: Get a built-in game/AAC activity by ID
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: builtin-cboard-aac
 *     responses:
 *       200:
 *         description: Built-in game retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 data:
 *                   $ref: '#/components/schemas/GameResource'
 */

/**
 * @swagger
 * /game/{id}/assign:
 *   post:
 *     summary: Assign a built-in game/AAC activity to a patient (SP only)
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: builtin-cpc-touch-anywhere
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId]
 *             properties:
 *               patientId:
 *                 type: string
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *               frequency:
 *                 type: string
 *                 example: 5 minutes daily
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Game assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 data:
 *                   $ref: '#/components/schemas/GameAssignment'
 *             example:
 *               status: SUCCESS
 *               data:
 *                 id: "8d2e633f-59e6-4c55-8d15-2d271a18e160"
 *                 patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *                 providerId: "2c3dc813-3df9-4cda-81b7-f39d80771f6a"
 *                 activityName: Cboard AAC Communication Board
 *                 activityCategory: GAME_ASSIGNMENT
 *                 durationMinutes: 0
 *                 outcome: ASSIGNED
 *                 metadata:
 *                   type: GAME_ASSIGNMENT
 *                   gameId: builtin-cboard-aac
 *                   externalProvider: cboard
 *                   launchUrl: https://app.cboard.io/
 *                   goals: ["Improve communication attempts"]
 *                   frequency: 5 minutes daily
 *               message: Game assigned successfully
 */

/**
 * @swagger
 * /game/{id}/participation:
 *   post:
 *     summary: Log a built-in game/AAC participation session
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: builtin-cpc-touch-anywhere
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId]
 *             properties:
 *               patientId:
 *                 type: string
 *               participatedOn:
 *                 type: string
 *                 format: date-time
 *               durationMinutes:
 *                 type: integer
 *               outcome:
 *                 type: string
 *                 enum: [COMPLETED, PARTIAL, SKIPPED, INTERRUPTED, REFUSED, CANCELLED]
 *                 description: |
 *                   COMPLETED - child completed the planned game/Cboard session.
 *                   PARTIAL - child started but completed only part of the planned session.
 *                   SKIPPED - assigned session was skipped and no play happened.
 *                   INTERRUPTED - session started but stopped because of a technical, health, behavior, or environment issue.
 *                   REFUSED - child refused or caregiver could not engage the child.
 *                   CANCELLED - session was cancelled before meaningful play started.
 *                 example: COMPLETED
 *               metrics:
 *                 type: object
 *                 example:
 *                   communicationAttempts: 12
 *                   successfulSelections: 8
 *                   promptedSelections: 3
 *                   symbolsUsed: 6
 *                   frustrationEvents: 1
 *               note:
 *                 type: string
 *           examples:
 *             completed:
 *               summary: Completed session
 *               value:
 *                 patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *                 durationMinutes: 10
 *                 outcome: COMPLETED
 *                 metrics:
 *                   communicationAttempts: 12
 *                   successfulSelections: 8
 *                   promptedSelections: 3
 *                   symbolsUsed: 6
 *                   frustrationEvents: 1
 *                 note: "Good engagement today"
 *             partial:
 *               summary: Partial session
 *               value:
 *                 patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *                 durationMinutes: 4
 *                 outcome: PARTIAL
 *                 metrics:
 *                   communicationAttempts: 5
 *                   successfulSelections: 2
 *                 note: "Stopped early because child became tired"
 *             skipped:
 *               summary: Skipped session
 *               value:
 *                 patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *                 durationMinutes: 0
 *                 outcome: SKIPPED
 *                 metrics: {}
 *                 note: "Caregiver was unavailable"
 *             interrupted:
 *               summary: Interrupted session
 *               value:
 *                 patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *                 durationMinutes: 3
 *                 outcome: INTERRUPTED
 *                 metrics:
 *                   communicationAttempts: 2
 *                 note: "Internet connection dropped"
 *             refused:
 *               summary: Child refused
 *               value:
 *                 patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *                 durationMinutes: 0
 *                 outcome: REFUSED
 *                 metrics: {}
 *                 note: "Child refused to participate"
 *             cancelled:
 *               summary: Cancelled session
 *               value:
 *                 patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *                 durationMinutes: 0
 *                 outcome: CANCELLED
 *                 metrics: {}
 *                 note: "Session cancelled before starting"
 *     responses:
 *       201:
 *         description: Participation logged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 data:
 *                   $ref: '#/components/schemas/GameParticipationLog'
 *             example:
 *               status: SUCCESS
 *               data:
 *                 id: "b917aab9-1872-4b99-a85f-d0b1d8e39776"
 *                 patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *                 providerId: "2c3dc813-3df9-4cda-81b7-f39d80771f6a"
 *                 activityName: Cboard AAC Communication Board
 *                 activityCategory: GAME_PLAY
 *                 durationMinutes: 10
 *                 outcome: COMPLETED
 *                 metadata:
 *                   type: GAME_PLAY
 *                   gameId: builtin-cboard-aac
 *                   externalProvider: cboard
 *                   metrics:
 *                     communicationAttempts: 12
 *                     successfulSelections: 8
 *                     promptedSelections: 3
 *                     symbolsUsed: 6
 *                     frustrationEvents: 1
 *               message: Game participation logged successfully
 */

/**
 * @swagger
 * /game/patients/{patientId}/assignments:
 *   get:
 *     summary: List a patient's game assignments
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient game assignments retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GameAssignment'
 */

/**
 * @swagger
 * /game/patients/{patientId}/improvement:
 *   get:
 *     summary: Summarize patient improvement across built-in game/AAC sessions
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: gameId
 *         schema:
 *           type: string
 *         example: builtin-cpc-touch-anywhere
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Improvement summary retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 data:
 *                   $ref: '#/components/schemas/GameImprovementSummary'
 *             example:
 *               status: SUCCESS
 *               data:
 *                 patientId: "8f2c1c0b-4f9d-4a3c-9e7a-3d8b2f1c9eaa"
 *                 totalSessions: 2
 *                 totalDurationMinutes: 20
 *                 games:
 *                   - gameId: builtin-cboard-aac
 *                     activityName: Cboard AAC Communication Board
 *                     sessions: 2
 *                     totalDurationMinutes: 20
 *                     firstMetrics:
 *                       communicationAttempts: 5
 *                       successfulSelections: 2
 *                     lastMetrics:
 *                       communicationAttempts: 12
 *                       successfulSelections: 8
 *                     metricChanges:
 *                       communicationAttempts:
 *                         first: 5
 *                         last: 12
 *                         change: 7
 *                       successfulSelections:
 *                         first: 2
 *                         last: 8
 *                         change: 6
 *               message: Game improvement summary retrieved successfully
 */
