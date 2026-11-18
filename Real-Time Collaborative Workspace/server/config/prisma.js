import { PrismaClient } from "@prisma/client";

// Sanitize and trim environment variable to prevent leading/trailing whitespace errors
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.trim();
}

const dbUrl = (process.env.DATABASE_URL || "").trim();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

export default prisma;
