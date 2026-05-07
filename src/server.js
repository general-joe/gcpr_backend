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
import prisma from './config/database.js'
import { auditRequest } from './middlewares/audit.js'

// ROUTING

dotenv.config()

const app = express()
app.set('trust proxy', 1);
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

// Eagerly initialize Firebase so errors surface at startup
import { initializeFirebase } from './utils/firebaseService.js';
initializeFirebase();

const socketError = (socket, message) => {
  socket.emit('socket-error', { message });
};

const ensureCommunityMembership = async (userId, communityId) => {
  return prisma.communityMember.findUnique({
    where: {
      communityId_userId: {
        communityId,
        userId,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });
};

const ensureGroupMembership = async (userId, groupId) => {
  return prisma.communityGroupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });
};

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
app.use(auditRequest());

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
  const errorTimestamp = new Date().toISOString();
  const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Log error context
  const errorContext = {
    errorId,
    method: req.method,
    path: req.path,
    query: req.query,
    userId: res.locals?.user?.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: errorTimestamp,
    errorMessage: err.message,
    errorStack: err.stack,
    errorName: err.name,
  };

  // Known HTTP errors (your custom errors)
  if (err instanceof gcprError) {
    WRITE.warn(`Handled Error: ${err.message}`, {
      ...errorContext,
      statusCode: err.status || 400,
    });
    return res.status(err.status || 400).json({
      status: err.status || 400,
      message: err.message,
      errorId,
    });
  }

  // Prisma errors
  if (err?.name?.includes('Prisma')) {
    WRITE.error(`Database Error: ${err.message}`, {
      ...errorContext,
      prismaCode: err.code,
      statusCode: 500,
    });
    return res.status(500).json({
      status: 500,
      message: 'Database operation failed',
      errorId,
    });
  }

  // Unexpected errors
  WRITE.error(`Unhandled Error: ${err.message || 'Unknown error'}`, {
    ...errorContext,
    statusCode: 500,
  });

  // Fallback (unknown errors)
  return res.status(500).json({
    status: 500,
    message: 'Internal server error',
    errorId,
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  const authenticatedUser = socket.data.user;

  WRITE.info(`User connected: ${socket.id}`, {
    userId: authenticatedUser.id,
    role: authenticatedUser.role,
  });

  socket.join(`user-${authenticatedUser.id}`);

  // Join user-specific room for direct messages
  socket.on('join-user-room', (userId) => {
    if (userId && userId !== authenticatedUser.id) {
      return socketError(socket, 'Forbidden room join');
    }

    socket.join(`user-${authenticatedUser.id}`);
    WRITE.info(`User ${authenticatedUser.id} joined room user-${authenticatedUser.id}`);
  });

  // Join community room
  socket.on('join-community-room', async (communityId) => {
    const membership = await ensureCommunityMembership(
      authenticatedUser.id,
      communityId,
    );

    if (!membership || membership.status !== 'ACTIVE') {
      return socketError(socket, 'Forbidden community room join');
    }

    socket.join(`community-${communityId}`);
    WRITE.info(`User joined community room community-${communityId}`, {
      userId: authenticatedUser.id,
    });
  });

  // Join community group room
  socket.on('join-community-group-room', async (groupId) => {
    const membership = await ensureGroupMembership(authenticatedUser.id, groupId);

    if (!membership) {
      return socketError(socket, 'Forbidden community group room join');
    }

    socket.join(`community-group-${groupId}`);
    WRITE.info(`User joined community group room community-group-${groupId}`, {
      userId: authenticatedUser.id,
    });
  });

  // Handle typing indicators for direct messages
  socket.on('typing-start', ({ roomId, isTyping }) => {
    socket.to(roomId).emit('typing-start', {
      userId: authenticatedUser.id,
      isTyping,
    });
  });

  socket.on('typing-stop', ({ roomId, isTyping }) => {
    socket.to(roomId).emit('typing-stop', {
      userId: authenticatedUser.id,
      isTyping,
    });
  });

  // Handle typing indicators for community messages
  socket.on('community-typing-start', ({ communityId, groupId, isTyping }) => {
    const roomId = groupId ? `community-group-${groupId}` : `community-${communityId}`;
    socket.to(roomId).emit('community-typing-start', {
      userId: authenticatedUser.id,
      isTyping,
      communityId,
      groupId,
    });
  });

  socket.on('community-typing-stop', ({ communityId, groupId, isTyping }) => {
    const roomId = groupId ? `community-group-${groupId}` : `community-${communityId}`;
    socket.to(roomId).emit('community-typing-stop', {
      userId: authenticatedUser.id,
      isTyping,
      communityId,
      groupId,
    });
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
    WRITE.info(`User disconnected: ${socket.id}`, {
      userId: authenticatedUser.id,
    });
  });
});

export default server
