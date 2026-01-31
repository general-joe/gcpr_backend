import fs from "fs";
import path from "path";

const LogLevel = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
};

class Logger {
  constructor() {
    this.logDir = path.join(process.cwd(), "logs");
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta) {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  log(level, message, meta) {
    const formattedMessage = this.formatMessage(level, message, meta);
    // Console output
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
    // File output (async, non-blocking)
    const logFile = path.join(this.logDir, `${new Date().toISOString().split("T")[0]}.log`);
    fs.appendFile(logFile, formattedMessage + "\n", (err) => {
      if (err) console.error("Failed to write to log file:", err);
    });
  }

  debug(message, meta) {
    if (process.env.NODE_ENV !== "production") {
      this.log(LogLevel.DEBUG, message, meta);
    }
  }

  info(message, meta) {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message, meta) {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message, meta) {
    this.log(LogLevel.ERROR, message, meta);
  }
}

export const logger = new Logger();
export default logger;
