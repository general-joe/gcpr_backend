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
