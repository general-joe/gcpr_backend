/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     DirectMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         senderId:
 *           type: string
 *         receiverId:
 *           type: string
 *         content:
 *           type: string
 *           nullable: true
 *         mediaUrl:
 *           type: string
 *           nullable: true
 *         caption:
 *           type: string
 *           nullable: true
 *           description: Caption for media messages
 *         type:
 *           type: string
 *           enum: [TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT, LOCATION]
 *         status:
 *           type: string
 *           enum: [SENT, DELIVERED, READ]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     SendMessageRequest:
 *       type: object
 *       required:
 *         - receiverId
 *       properties:
 *         receiverId:
 *           type: string
 *           description: ID of the user to send message to
 *         content:
 *           type: string
 *           description: Text content of the message
 *         mediaUrl:
 *           type: string
 *           description: URL to media attachment
 *         caption:
 *           type: string
 *           description: Caption for media messages
 *         type:
 *           type: string
 *           enum: [TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT, LOCATION]
 *           default: TEXT
 *           description: Type of message content
 *
 *     Conversation:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         fullName:
 *           type: string
 *         profileImage:
 *           type: string
 *           nullable: true
 *         lastMessage:
 *           type: string
 *           nullable: true
 *         lastMessageAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         unreadCount:
 *           type: integer
 *
 *     TypingEvent:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user who is typing
 *         isTyping:
 *           type: boolean
 *           description: Whether the user is typing (true) or stopped (false)
 *
 *     NewDirectMessageEvent:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         senderId:
 *           type: string
 *         receiverId:
 *           type: string
 *         content:
 *           type: string
 *           nullable: true
 *         mediaUrl:
 *           type: string
 *           nullable: true
 *         caption:
 *           type: string
 *           nullable: true
 *           description: Caption for media messages
 *         type:
 *           type: string
 *           enum: [TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT, LOCATION]
 *         status:
 *           type: string
 *           enum: [SENT, DELIVERED, READ]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 * /direct-message:
 *   post:
 *     summary: Send a direct message
 *     tags: [Direct Message]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageRequest'
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/DirectMessage'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot send message to yourself
 *
 * /direct-message/{userId}:
 *   get:
 *     summary: Get messages with a specific user
 *     tags: [Direct Message]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                     $ref: '#/components/schemas/DirectMessage'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *
 * /direct-message/conversations:
 *   get:
 *     summary: Get all conversations for the current user
 *     tags: [Direct Message]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
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
 *                     $ref: '#/components/schemas/Conversation'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *
 * /direct-message/{messageId}/read:
 *   put:
 *     summary: Mark a message as read
 *     tags: [Direct Message]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/DirectMessage'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to mark this message as read
 *
 * /direct-message/{messageId}:
 *   delete:
 *     summary: Delete a direct message
 *     tags: [Direct Message]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties: {}
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to delete this message
 *       404:
 *         description: Message not found
 *
 * /direct-message/realtime:
 *   get:
 *     summary: Real-time direct messaging via Socket.IO
 *     tags: [Direct Message, Real-time]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Use Socket.IO for real-time direct messaging features including typing indicators and instant message delivery.
 *       Connect to the Socket.IO server at the same endpoint as your HTTP API.
 *       
 *       Events:
 *       - `join-user-room`: Join a user-specific room to receive direct messages
 *         Payload: { userId: string }
 *         
 *       - `typing-start`: Notify others that you started typing
 *         Payload: { roomId: string, userId: string, isTyping: boolean }
 *         
 *       - `typing-stop`: Notify others that you stopped typing
 *         Payload: { roomId: string, userId: string, isTyping: boolean }
 *         
 *       - `new-direct-message`: Sent when a new direct message is received
 *         Payload: DirectMessage object
 *       
 *       Rooms:
 *       - User rooms: `user-{userId}` for receiving direct messages
 *       
 *       Example usage:
 *       ```javascript
 *       const socket = io('http://localhost:3000');
 *       
 *       // Join your user room
 *       socket.emit('join-user-room', 'user-id-here');
 *       
 *       // Listen for typing events from others
 *       socket.on('typing-start', (data) => {
 *         console.log(`${data.userId} is typing...`);
 *       });
 *       
 *       // Listen for new messages
 *       socket.on('new-direct-message', (message) => {
 *         console.log('New message:', message);
 *       });
 *       
 *       // Notify when you start typing
 *       socket.emit('typing-start', {
 *         roomId: 'user-recipient-id',
 *         userId: 'your-user-id',
 *         isTyping: true
 *       });
 *       ```
 *     responses:
 *       200:
 *         description: Socket.IO connection information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 description:
 *                   type: string
 *                 example:
 *                   type: string
 */