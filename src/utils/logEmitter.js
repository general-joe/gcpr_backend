import { EventEmitter } from "node:events";

/**
 * In-memory event emitter for real-time log streaming.
 * 
 * The morgan stream writes HTTP log entries here, and the SSE endpoint
 * (streamLiveLogs) subscribes to receive them instantly — no filesystem polling needed.
 */
class LogEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Support many concurrent SSE connections
  }
}

export const logEmitter = new LogEmitter();
export default logEmitter;