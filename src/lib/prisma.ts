import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const absoluteDbPath = path.resolve(process.cwd(), "dev.db");
const sqliteUrl = `file:${absoluteDbPath.replace(/\\/g, "/")}`;

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl || databaseUrl.startsWith("file:")) {
    const adapter = new PrismaBetterSqlite3({
      url: databaseUrl || sqliteUrl,
    });

    return new PrismaClient({ adapter });
  }

  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
