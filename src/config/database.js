import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import pg from "pg";
import dotenv from "dotenv";
import WRITE from "../utils/logger.js";

const { PrismaClient } = pkg;

dotenv.config();

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const databaseUrl = process.env.NODE_ENV === "test" && process.env.DATABASE_URL_TEST
  ? process.env.DATABASE_URL_TEST
  : process.env.DATABASE_URL;

const poolMax = toPositiveInt(process.env.DB_POOL_MAX, 10);
const idleTimeoutMillis = toPositiveInt(process.env.DB_POOL_IDLE_TIMEOUT_MS, 30000);
const connectionTimeoutMillis = toPositiveInt(process.env.DB_POOL_CONNECTION_TIMEOUT_MS, 10000);
const statementTimeout = toPositiveInt(process.env.DB_STATEMENT_TIMEOUT_MS, 30000);
const slowQueryMs = toPositiveInt(process.env.DB_SLOW_QUERY_MS, 750);
const sslConfig = process.env.DATABASE_SSL === "false"
  ? false
  : { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true" };

/**
 * PostgreSQL Pool
 * AWS RDS PostgreSQL requires SSL.
 */
const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: poolMax,
  idleTimeoutMillis,
  connectionTimeoutMillis,
  statement_timeout: statementTimeout,
  query_timeout: statementTimeout,
  application_name: process.env.DB_APPLICATION_NAME || "gcpr_backend",
  ssl: sslConfig,
});

pool.on("error", (error) => {
  WRITE.error("Unexpected PostgreSQL pool error", { error: error.message });
});

/**
 * Prisma Adapter
 */
const adapter = new PrismaPg(pool);

/**
 * Shared Prisma Client Instance
 * Prevents multiple Prisma instances during development.
 */
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "warn" },
      { emit: "event", level: "error" },
    ],
  });

prisma.$on("query", (event) => {
  if (event.duration >= slowQueryMs) {
    WRITE.warn("Slow database query detected", {
      durationMs: event.duration,
      target: event.target,
      query: event.query,
    });
  }
});

prisma.$on("warn", (event) => {
  WRITE.warn("Prisma warning", { message: event.message, target: event.target });
});

prisma.$on("error", (event) => {
  WRITE.error("Prisma error", { message: event.message, target: event.target });
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful Shutdown
 */
const shutdown = async (signal) => {
  console.log(`Received ${signal}. Closing Prisma connection...`);

  try {
    await prisma.$disconnect();
    await pool.end();
    console.log("Database connections closed.");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export default prisma;
