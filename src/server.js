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
import morganStream from './utils/morganStream.js'
import router from './routes/index.route.js'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger.js'
import filesRouter from './modules/files/files.route.js'
import prisma from './config/database.js'
import { auditRequest } from './middlewares/audit.js'

const errorCodeFromMessage = (message = 'ERROR') =>
  message
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, 80) || 'ERROR';

const prismaHint = (code) => {
  switch (code) {
    case 'P2002':
      return 'This value is already used. Use a different value and try again.';
    case 'P2003':
      return 'One of the referenced records does not exist or is no longer available.';
    case 'P2025':
      return 'The record you are trying to update or delete could not be found.';
    default:
      return 'Please check the request data and try again. If the issue continues, contact support.';
  }
};

// ROUTING

dotenv.config()

const app = express()
app.set('trust proxy', 1);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.length === 0) {
    return process.env.NODE_ENV !== 'production';
  }
  return allowedOrigins.includes(origin);
};

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
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

app.use(compression({
  // Do not compress SSE endpoints — compression buffers the stream,
  // preventing real-time delivery and breaking the raw byte reader on the client
  filter: (req, res) => {
    if (req.path === "/admin/logs/stream/live" || req.path === "/admin/logs/migrate") {
      return false;
    }
    return compression.filter(req, res);
  },
}));
app.use(cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTION',
    credentials: true,
    exposedHeaders: ['x-auth-token']
}))


app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(cookieParser())
app.use(morgan("dev", { stream: morganStream }));
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
    userId: res.locals?.user?.id,
    ip: req.ip,
    timestamp: errorTimestamp,
    errorMessage: err.message,
    errorName: err.name,
    ...(process.env.NODE_ENV !== 'production' ? { errorStack: err.stack } : {}),
  };

  // Known HTTP errors (your custom errors)
  if (err instanceof gcprError) {
    const statusCode = err.status || 400;
    const errorCode = err.errorCode || errorCodeFromMessage(err.message);
    WRITE.warn(`Handled Error: ${err.message}`, {
      ...errorContext,
      statusCode,
      errorCode,
    });

    return res.status(statusCode).json({
      status: 'FAILED',
      statusCode,
      errorCode,
      message: err.message,
      details: err.details,
      hint: err.hint,
      errorId,
    });
  }

  // Prisma errors
  if (err?.name?.includes('Prisma')) {
    const prismaErrorContext = {
      ...errorContext,
      prismaCode: err.code,
      prismaMeta: err.meta,
      prismaClientVersion: err.clientVersion,
      statusCode: 500,
    };

    // Map Prisma error codes to user-friendly messages
    let userMessage = 'Database operation failed';
    let httpStatus = 500;

    switch (err.code) {
      case 'P2000':
        userMessage = 'Value too long for database column';
        break;
      case 'P2001':
        userMessage = 'Record does not exist';
        httpStatus = 404;
        break;
      case 'P2002':
        userMessage = 'A record with this value already exists';
        httpStatus = 409;
        break;
      case 'P2003':
        userMessage = 'Referenced record not found';
        httpStatus = 400;
        break;
      case 'P2004':
        userMessage = 'Database constraint violation';
        break;
      case 'P2005':
        userMessage = 'Invalid database value';
        break;
      case 'P2011':
        userMessage = 'Required field is missing';
        httpStatus = 400;
        break;
      case 'P2014':
        userMessage = 'Required relation violation';
        httpStatus = 400;
        break;
      case 'P2021':
        userMessage = 'Database table does not exist';
        break;
      case 'P2022':
        userMessage = 'Database column does not exist';
        break;
      case 'P2023':
        userMessage = 'Inconsistent database data';
        break;
      case 'P2025':
        userMessage = 'Record not found for update';
        httpStatus = 404;
        break;
      default:
        userMessage = 'Database operation failed';
    }

    WRITE.error(`Database Error [${err.code}]: ${err.message}`, prismaErrorContext);

    return res.status(httpStatus).json({
      status: 'FAILED',
      statusCode: httpStatus,
      errorCode: err.code || 'DATABASE_ERROR',
      message: userMessage,
      details: err.code === 'P2002' && err.meta?.target
        ? { fields: err.meta.target }
        : undefined,
      meta: process.env.NODE_ENV !== 'production' ? err.meta : undefined,
      hint: prismaHint(err.code),
      errorId,
    });
  }

  // Unexpected errors
  WRITE.error(`Unhandled Error: ${err.message || 'Unknown error'}`, {
    ...errorContext,
    statusCode: 500,
  });

  return res.status(500).json({
    status: 'FAILED',
    statusCode: 500,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    hint: 'Please try again later. If the issue continues, contact support with the errorId.',
    errorId,
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  const authenticatedUser = socket.data.user;

  WRITE.info(`User connected: ${socket.id}`, {
    userId: authenticatedUser.id,
    userType: authenticatedUser.userType,
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
