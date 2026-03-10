/**
 * @swagger
 * /audio:
 *   post:
 *     summary: Upload an audio file and receive a protected URL
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Audio uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *       400:
 *         description: Audio file is required
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Unsupported audio type
 *
 * /audio/{fileName}:
 *   get:
 *     summary: Get protected audio file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audio stream
 *         content:
 *           audio/*:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid filename/path
 *       404:
 *         description: File not found
 *
 * /profiles/{fileName}:
 *   get:
 *     summary: Get protected profile file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File stream
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid filename/path
 *       404:
 *         description: File not found
 *
 * /licenses/{fileName}:
 *   get:
 *     summary: Get protected license file (own license only)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File stream
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed to access this license
 *       404:
 *         description: Service provider profile or file not found
 */
