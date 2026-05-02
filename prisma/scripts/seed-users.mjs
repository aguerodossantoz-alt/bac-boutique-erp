import path from "node:path";
import { pathToFileURL } from "node:url";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const dbPath = path.resolve(process.cwd(), "dev.db");
const dbUrl = pathToFileURL(dbPath).href;

const adapter = new PrismaBetterSqlite3({
  url: dbUrl,
});

const prisma = new PrismaClient({ adapter });

const users = [
  {
    username: "owner",
    password: "Owner2026!",
    displayName: "Владелец",
    role: "OWNER",
    store: null,
  },
  {
    username: "admin",
    password: "Admin2026!",
    displayName: "Администратор",
    role: "ADMIN",
    store: null,
  },
  {
    username: "cashier_s1_1",
    password: "CashierS1A2026!",
    displayName: "Кассир 1 / Магазин 1",
    role: "CASHIER",
    store: "Магазин 1",
  },
  {
    username: "cashier_s1_2",
    password: "CashierS1B2026!",
    displayName: "Кассир 2 / Магазин 1",
    role: "CASHIER",
    store: "Магазин 1",
  },
  {
    username: "cashier_s2_1",
    password: "CashierS2A2026!",
    displayName: "Кассир / Магазин 2",
    role: "CASHIER",
    store: "Магазин 2",
  },
];

async function main() {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        passwordHash,
        displayName: user.displayName,
        role: user.role,
        store: user.store,
        isActive: true,
      },
      create: {
        username: user.username,
        passwordHash,
        displayName: user.displayName,
        role: user.role,
        store: user.store,
        isActive: true,
      },
    });
  }

  console.log("Пользователи созданы или обновлены.");
}

main()
  .catch((error) => {
    console.error("Ошибка seed users:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });