import fs from "fs";
import path from "path";
import { logEmitter } from "./logEmitter.js";

const LOGS_DIR = path.resolve(process.env.LOGS_DIR || "logs");

/**
 * Custom Morgan stream that writes HTTP request logs to the daily log file
 * AND emits each log line as a real-time event on the logEmitter.
 *
 * The SSE live log stream endpoint subscribes to logEmitter for instant delivery
 * (no filesystem polling latency), while the file write preserves history for
 * the static log viewer.
 */
class MorganStream {
  constructor() {
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
  }

  /**
   * Called by morgan for each log line.
   * Forwards to stdout, writes to the daily log file, and emits on the event bus.
   */
  write(line) {
    const trimmedLine = line.trimEnd();
    if (!trimmedLine) return;

    // Preserve original terminal output
    process.stdout.write(line);

    const timestamp = new Date().toISOString();
    const today = new Date().toISOString().split("T")[0];
    const logFile = path.join(LOGS_DIR, `${today}.log`);
    const formattedLine = `[${timestamp}] [HTTP] ${trimmedLine}`;

    // Write to the daily log file (async, non-blocking)
    fs.appendFile(logFile, formattedLine + "\n", (err) => {
      if (err) console.error("Failed to write morgan log to file:", err);
    });

    // Emit in real time so the SSE stream delivers it instantly
    logEmitter.emit("log", {
      type: "append",
      name: `${today}.log`,
      content: formattedLine,
    });
  }
}

export const morganStream = new MorganStream();
export default morganStream;
