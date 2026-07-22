/**
 * @swagger
 * tags:
 *   name: Game
 *   description: Wellbeing game/resource management
 */

/**
 * @swagger
 * /game:
 *   post:
 *     summary: Create a game resource (SP only)
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               source:
 *                 type: string
 *                 enum: [UPLOADED, YOUTUBE, EXTERNAL]
 *               externalUrl:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Game created
 *   get:
 *     summary: List game resources
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
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
 *         description: List of games
 */

/**
 * @swagger
 * /game/{id}:
 *   get:
 *     summary: Get game resource by ID
 *     tags: [Game]
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
 *         description: Game retrieved
 *   patch:
 *     summary: Update game resource (owner SP only)
 *     tags: [Game]
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
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               thumbnail:
 *                 type: string
 *               allowedRoleSlugs:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Game updated
 *   delete:
 *     summary: Delete game resource (owner SP only)
 *     tags: [Game]
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
 *         description: Game deleted
 */

/**
 * @swagger
 * /game/selectable:
 *   get:
 *     summary: List selectable games, including built-in Cboard AAC and CPC accessible games
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [UPLOADED, YOUTUBE, EXTERNAL]
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Selectable games retrieved. Built-in examples include builtin-cboard-aac, builtin-cpc-accessible-games, and builtin-cpc-touch-anywhere.
 */

/**
 * @swagger
 * /game/{id}/assign:
 *   post:
 *     summary: Assign a game, Cboard AAC activity, or CPC accessible game to a patient (SP only)
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
 *                 example: ["Request preferred item using symbols", "Reduce prompted selections"]
 *               frequency:
 *                 type: string
 *                 example: 10 minutes daily
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
 *     summary: Log a patient game, Cboard, or CPC accessible-game participation session
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
 *     summary: Summarize patient improvement across game, Cboard, or CPC accessible-game sessions
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
 *         example: builtin-cboard-aac
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

/**
 * @swagger
 * /game/{id}/publish:
 *   post:
 *     summary: Publish a game resource (owner SP only)
 *     tags: [Game]
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
 *         description: Game published
 */

/**
 * @swagger
 * /game/{id}/unpublish:
 *   post:
 *     summary: Unpublish a game resource (owner SP only)
 *     tags: [Game]
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
 *         description: Game unpublished
 */
