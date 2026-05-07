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
