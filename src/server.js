import dotenv from 'dotenv'
import compression from 'compression'
import express from 'express'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import cors from 'cors'
import { Server } from 'socket.io'
import http from 'http'

// Global Variables
import WRITE from './utils/logger.js'

import CONSTANTS from './utils/constants.js'
import MOMENT from 'moment'
import _ from 'lodash'
import gcprError from './utils/http-error.js'
import router from './routes/index.route.js'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger.js'
import filesRouter from './modules/files/files.route.js'

// ROUTING

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

global.WRITE = WRITE
global.CONSTANTS = CONSTANTS
global.MOMENT = MOMENT
global._ = _
global.gcprError = gcprError
global.io = io

// Initialize Socket.IO instance
import { initializeSocketIO } from './socket.io.js';
initializeSocketIO(io);



app.use(compression())
app.use(cors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTION',
    credentials: true,
    exposedHeaders: ['x-auth-token']
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(cookieParser())
app.use(morgan("dev"));

// Serve Swagger docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.get('/docs.json', (req, res) => res.json(swaggerSpec))

app.use(filesRouter)
app.use(router)




app.get('/', (req, res) => {
    res.send({
        status: 'ok',
        env: process.env.NODE_ENV,
        date: MOMENT(),
        visitor: req.ip,
        version: 1.0
    })
})

app.use((err, req, res, next) => {
  // Known HTTP errors (your custom errors)
  if (err instanceof gcprError) {
    return res.status(err.status || 400).json({
      status: err.status || 400,
      message: err.message,
    });
  }

  // Prisma errors
  if (err?.name?.includes('Prisma')) {
    return res.status(500).json({
      status: 500,
      message: 'Database error',
    });
  }

  // Fallback (unknown errors)
  return res.status(500).json({
    status: 500,
    message: err.message || 'Internal server error',
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  WRITE.info(`User connected: ${socket.id}`);

  // Join user-specific room for direct messages
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    WRITE.info(`User ${userId} joined room user-${userId}`);
  });

  // Join community room
  socket.on('join-community-room', (communityId) => {
    socket.join(`community-${communityId}`);
    WRITE.info(`User joined community room community-${communityId}`);
  });

  // Join community group room
  socket.on('join-community-group-room', (groupId) => {
    socket.join(`community-group-${groupId}`);
    WRITE.info(`User joined community group room community-group-${groupId}`);
  });

  // Handle typing indicators for direct messages
  socket.on('typing-start', ({ roomId, userId, isTyping }) => {
    socket.to(roomId).emit('typing-start', { userId, isTyping });
  });

  socket.on('typing-stop', ({ roomId, userId, isTyping }) => {
    socket.to(roomId).emit('typing-stop', { userId, isTyping });
  });

  // Handle typing indicators for community messages
  socket.on('community-typing-start', ({ communityId, groupId, userId, isTyping }) => {
    const roomId = groupId ? `community-group-${groupId}` : `community-${communityId}`;
    socket.to(roomId).emit('community-typing-start', { userId, isTyping, communityId, groupId });
  });

  socket.on('community-typing-stop', ({ communityId, groupId, userId, isTyping }) => {
    const roomId = groupId ? `community-group-${groupId}` : `community-${communityId}`;
    socket.to(roomId).emit('community-typing-stop', { userId, isTyping, communityId, groupId });
  });

  // Handle new direct message
  socket.on('new-direct-message', (messageData) => {
    // Send to both sender and receiver rooms
    io.to(`user-${messageData.senderId}`).emit('new-direct-message', messageData);
    io.to(`user-${messageData.receiverId}`).emit('new-direct-message', messageData);
  });

  // Handle new community message
  socket.on('new-community-message', (messageData) => {
    const { communityId, groupId } = messageData;
    const roomId = groupId ? `community-group-${groupId}` : `community-${communityId}`;
    io.to(roomId).emit('new-community-message', messageData);
  });

  // Handle new community announcement
  socket.on('new-community-announcement', (announcementData) => {
    const { communityId } = announcementData;
    io.to(`community-${communityId}`).emit('new-community-announcement', announcementData);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    WRITE.info(`User disconnected: ${socket.id}`);
  });
});

export default server
