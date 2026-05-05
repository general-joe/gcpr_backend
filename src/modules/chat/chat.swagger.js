/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: AI-powered caregiver chatbot — session and messaging endpoints
 *
 * /chat/quick:
 *   post:
 *     summary: Create a session and send the first message in one request
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "What exercises help children with CP improve motor skills?"
 *     responses:
 *       201:
 *         description: Chat session created and first reply returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ChatMessageResult'
 *       400:
 *         description: Message is required
 *       401:
 *         description: Unauthorized
 *
 * /chat/sessions:
 *   post:
 *     summary: Create a new empty chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Chat session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ChatSession'
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: List the current user's chat sessions
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Sessions retrieved
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
 *                     sessions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChatSession'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *
 * /chat/sessions/{sessionId}:
 *   get:
 *     summary: Get metadata for a single chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat session ID
 *     responses:
 *       200:
 *         description: Session retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ChatSession'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *   delete:
 *     summary: Delete a chat session and all its messages
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat session ID
 *     responses:
 *       200:
 *         description: Session deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *
 * /chat/sessions/{sessionId}/messages:
 *   get:
 *     summary: Get paginated message history for a session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat session ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Messages retrieved
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChatMessage'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *   post:
 *     summary: Send a message in an existing chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "How many repetitions should I do daily?"
 *     responses:
 *       201:
 *         description: Message sent and AI reply returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ChatMessageResult'
 *       400:
 *         description: Message is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *
 * components:
 *   schemas:
 *     ChatSession:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *           nullable: true
 *           example: "Motor skill exercises"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ChatMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         sessionId:
 *           type: string
 *           format: uuid
 *         role:
 *           type: string
 *           enum: [user, assistant]
 *         content:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     ChatMessageResult:
 *       type: object
 *       properties:
 *         sessionId:
 *           type: string
 *           format: uuid
 *         userMessage:
 *           $ref: '#/components/schemas/ChatMessage'
 *         assistantMessage:
 *           $ref: '#/components/schemas/ChatMessage'
 */
