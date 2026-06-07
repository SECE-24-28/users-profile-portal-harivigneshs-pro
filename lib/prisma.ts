// lib/prisma.ts
// Prisma Client singleton for Prisma 7 — uses the pg driver adapter.
// Prevents multiple instances during Next.js hot-reloading in development.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// ─── GLOBAL SINGLETON ────────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// ─── CREATE PRISMA CLIENT ────────────────────────────────────────────────────
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  // Create a pg connection pool
  const pool = new Pool({ connectionString });

  // Wrap the pool in Prisma's pg adapter
  const adapter = new PrismaPg(pool);

  // Create the Prisma client with the adapter
  return new PrismaClient({ adapter, log: ["error"] });
}

// Re-use existing client in development to avoid connection exhaustion
const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
