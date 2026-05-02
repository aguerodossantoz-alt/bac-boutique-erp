import "dotenv/config";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig } from "prisma/config";

const dbPath = path.resolve(process.cwd(), "dev.db");
const dbUrl = pathToFileURL(dbPath).href;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: dbUrl,
  },
});