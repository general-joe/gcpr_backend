import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { requireRbacRole } from "../../middlewares/auth.js";
import { logEmitter } from "../../utils/logEmitter.js";

const execAsync = promisify(exec);
const LOGS_DIR = path.resolve(process.env.LOGS_DIR || "logs");

const listLogFiles = () => {
  if (!fs.existsSync(LOGS_DIR)) return [];
  return fs
    .readdirSync(LOGS_DIR)
    .map((file) => {
      const fullPath = path.join(LOGS_DIR, file);
      const stats = fs.statSync(fullPath);
      return {
        name: file,
        size: stats.size,
        modifiedAt: stats.mtime,
      };
    })
    .sort((a, b) => (b.modifiedAt > a.modifiedAt ? 1 : -1));
};

const readLogFile = (filename, tailLines = null) => {
  const requestedPath = path.join(LOGS_DIR, filename);
  if (!requestedPath.startsWith(LOGS_DIR)) return null;
  if (!fs.existsSync(requestedPath)) return null;
  const content = fs.readFileSync(requestedPath, "utf-8");
  if (!tailLines) return content;
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");
  const tail = lines.slice(-tailLines);
  return tail.join("\n");
};

export default class LogsController {
  static listLogs = catchAsync(async (req, res) => {
    const files = listLogFiles();
    UtilFunctions.outputSuccess(res, { files }, "Log files retrieved");
  });

  static readLog = catchAsync(async (req, res) => {
    const { filename } = req.params;
    const tail = req.query.tail ? parseInt(req.query.tail, 10) : null;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;
    const content = readLogFile(filename, tail);

    if (content === null) {
      UtilFunctions.outputError(
        res,
        "Log file not found",
        {},
        "FAILED",
        404,
      );
      return;
    }

    // Apply date range filtering if provided
    let filteredContent = content;
    if (startDate || endDate) {
      const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");
      // Normalize endDate to end of day so logs on that day are included
      const startDateTime = startDate ? new Date(startDate + "T00:00:00.000Z").getTime() : null;
      const endDateTime = endDate ? new Date(endDate + "T23:59:59.999Z").getTime() : null;

      filteredContent = lines.filter((line) => {
        // Extract date from common log formats:
        // "2026-06-14T10:53:36.000Z" (ISO), "[2026-06-14 10:53:36]" (bracket), "2026-06-14" (date-only)
        const isoMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
        const bracketMatch = line.match(/\[(\d{4}-\d{2}-\d{2})/);
        const dateOnlyMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
        const dateStr = isoMatch?.[1] || bracketMatch?.[1] || dateOnlyMatch?.[1];
        if (!dateStr) return true; // include lines without dates
        const lineTime = new Date(dateStr).getTime();
        if (Number.isNaN(lineTime)) return true; // include unparseable dates
        if (startDateTime && lineTime < startDateTime) return false;
        if (endDateTime && lineTime > endDateTime) return false;
        return true;
      }).join("\n");
    }

    UtilFunctions.outputSuccess(res, { filename, content: filteredContent, totalLines: content.split(/\r?\n/).filter(l => l.trim()).length, filteredLines: filteredContent.split(/\r?\n/).filter(l => l.trim()).length }, "Log file retrieved");
  });

  /**
   * SSE endpoint for streaming live logs
   * GET /admin/logs/stream/live
   *
   * Uses an in-memory EventEmitter (logEmitter) for instant log delivery,
   * with file-system polling as a fallback for history and new file detection.
   */
  static streamLiveLogs = catchAsync(async (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Send initial connected event
    res.write(`data: ${JSON.stringify({ type: "connected", message: "Live log stream connected" })}\n\n`);

    const getLatestLogFile = () => {
      const files = listLogFiles();
      if (files.length === 0) return null;
      return files[0];
    };

    let latestFile = getLatestLogFile();
    let knownFiles = new Set(listLogFiles().map((f) => f.name));

    // Send initial tail of the latest log file (history)
    if (latestFile) {
      const initialContent = readLogFile(latestFile.name, 50);
      if (initialContent) {
        res.write(`data: ${JSON.stringify({ type: "file", name: latestFile.name, content: initialContent })}\n\n`);
      }
    }

    // Listen for real-time log events from the in-memory emitter
    const onLog = (data) => {
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch {
        // If the connection is broken, remove listener — cleanup handles the rest
      }
    };
    logEmitter.on("log", onLog);

    // Keep a background interval for discovering new log files (e.g., day rollover)
    // and as a fallback if file-system appends happen outside the morgan stream
    const interval = setInterval(() => {
      try {
        const currentFiles = listLogFiles();
        const currentNames = new Set(currentFiles.map((f) => f.name));

        // Detect new log files (day boundary rollover)
        for (const name of currentNames) {
          if (!knownFiles.has(name)) {
            knownFiles = currentNames;
            latestFile = currentFiles[0];
            const content = readLogFile(name, 50);
            if (content) {
              res.write(`data: ${JSON.stringify({ type: "file", name, content })}\n\n`);
            }
            return;
          }
        }
      } catch {
        // Silently handle read errors during polling
      }
    }, 5000); // Check for new files every 5 seconds (less aggressive now)

    // Cleanup on disconnect
    req.on("close", () => {
      clearInterval(interval);
      logEmitter.off("log", onLog);
      res.end();
    });
  });

  /**
   * Run prisma migrations and stream output
   * GET /admin/logs/migrate (SSE)
   */
  static runMigrations = catchAsync(async (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const sendEvent = (type, data) => {
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    };

    sendEvent("info", { message: "Starting database migration..." });

    try {
      // Run prisma migrate deploy
      const deployResult = await execAsync("npx prisma migrate deploy 2>&1");
      sendEvent("success", { message: "Migration deploy completed", output: deployResult.stdout + (deployResult.stderr || "") });

      // Run prisma generate
      sendEvent("info", { message: "Running prisma generate..." });
      const generateResult = await execAsync("npx prisma generate 2>&1");
      sendEvent("success", { message: "Prisma generate completed", output: generateResult.stdout + (generateResult.stderr || "") });

      sendEvent("done", { message: "All migrations completed successfully" });
    } catch (error) {
      sendEvent("error", {
        message: "Migration failed",
        output: error.stderr || error.stdout || error.message,
      });
    }

    req.on("close", () => {
      res.end();
    });
  });

  /**
   * Run custom SQL query (for emergency fixes)
   * POST /admin/logs/query
   */
  static runQuery = catchAsync(async (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      UtilFunctions.outputError(res, "Query is required", {}, "FAILED", 400);
      return;
    }

    try {
      // Only allow SELECT queries for safety
      const trimmed = query.trim().toUpperCase();
      if (!trimmed.startsWith("SELECT") && !trimmed.startsWith("EXPLAIN")) {
        UtilFunctions.outputError(res, "Only SELECT queries are allowed", {}, "FAILED", 403);
        return;
      }

      // Import prisma at runtime to avoid circular issues
      const prisma = (await import("../../config/database.js")).default;
      const result = await prisma.$queryRawUnsafe(query);
      UtilFunctions.outputSuccess(res, { result }, "Query executed");
    } catch (error) {
      UtilFunctions.outputError(
        res,
        error.message || "Query execution failed",
        {},
        "FAILED",
        500
      );
    }
  });
}