import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const dbPath = path.resolve(process.cwd(), "dev.db");
const dbUrl = `file:${dbPath.replace(/\\/g, "/")}`;

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
    username: "ibragim",
    password: "Ibr_Bac_2026!",
    displayName: "Ибрагим",
    role: "CASHIER",
    store: "Магазин 1",
  },
  {
    username: "ramazan",
    password: "Ram_Bac_2026!",
    displayName: "Рамазан",
    role: "CASHIER",
    store: "Магазин 1",
  },
  {
    username: "murad",
    password: "Mur_Men_2026!",
    displayName: "Мурад",
    role: "CASHIER",
    store: "Магазин 2",
  },
  {
    username: "khamzat",
    password: "Kham_Manager_2026!",
    displayName: "Хамзат",
    role: "MANAGER",
    store: "Магазин 2",
  },
];

async function main() {
  await prisma.user.updateMany({
    where: {
      username: {
        in: ["cashier_s1_1", "cashier_s1_2", "cashier_s2_1"],
      },
    },
    data: {
      isActive: false,
    },
  });

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
