import jwt from "jsonwebtoken";
import WRITE from "./utils/logger.js";

let ioInstance = null;

const getSocketToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  const headerToken = socket.handshake.headers?.authorization;
  const queryToken = socket.handshake.query?.token;
  const rawToken = authToken || headerToken || queryToken;

  if (typeof rawToken !== "string" || rawToken.trim().length === 0) {
    return null;
  }

  return rawToken.startsWith("Bearer ")
    ? rawToken.slice(7).trim()
    : rawToken.trim();
};

const configureSocketAuthentication = (io) => {
  if (io.__gcprAuthConfigured) {
    return;
  }

  io.use(async (socket, next) => {
    const token = getSocketToken(socket);

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT);

      if (!decoded?.id || !decoded?.userType) {
        throw new Error("Invalid token payload");
      }

      socket.data.user = {
        id: decoded.id,
        userType: decoded.userType,
      };

      return next();
    } catch (error) {
      WRITE.warn("Socket authentication failed", {
        socketId: socket.id,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return next(new Error("Invalid or expired token"));
    }
  });

  io.__gcprAuthConfigured = true;
};

/**
 * Initialize Socket.IO instance
 * @param {Server} io - Socket.IO server instance
 */
const initializeSocketIO = (io) => {
  ioInstance = io;
  configureSocketAuthentication(io);
};

/**
 * Get Socket.IO instance
 * @returns {Server|null} Socket.IO server instance
 */
const getIO = () => {
  return ioInstance;
};

export { configureSocketAuthentication, initializeSocketIO, getIO };

export default {
  initializeSocketIO,
  getIO
};