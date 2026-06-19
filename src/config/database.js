import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import pg from "pg";
import dotenv from "dotenv";

const { PrismaClient } = pkg;

dotenv.config();

/**
 * PostgreSQL Pool
 * AWS RDS PostgreSQL requires SSL.
 */
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
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
    log: ["warn", "error"],
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