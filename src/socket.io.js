let ioInstance = null;

/**
 * Initialize Socket.IO instance
 * @param {Server} io - Socket.IO server instance
 */
const initializeSocketIO = (io) => {
  ioInstance = io;
};

/**
 * Get Socket.IO instance
 * @returns {Server|null} Socket.IO server instance
 */
const getIO = () => {
  return ioInstance;
};

export { initializeSocketIO, getIO };

export default {
  initializeSocketIO,
  getIO
};