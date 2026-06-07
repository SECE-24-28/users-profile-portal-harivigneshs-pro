// prisma.config.ts
// Prisma 7 configuration — defines the database connection and schema path.

import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Load .env.local first, then fall back to .env
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
});
