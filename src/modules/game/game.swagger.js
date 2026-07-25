/**
 * @swagger
 * tags:
 *   name: Game
 *   description: Built-in Cboard/CPC activity assignment and progress tracking
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
 *                 example: COMPLETED
 *               metrics:
 *                 type: object
 *                 example:
 *                   attempts: 12
 *                   successfulRounds: 8
 *                   independentActivations: 7
 *                   promptsNeeded: 3
 *                   engagementRating: 4
 *                   frustrationEvents: 1
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Participation logged
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
 */
