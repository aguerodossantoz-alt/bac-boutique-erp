import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type AppRole = "owner" | "admin" | "manager" | "cashier";

type ExpenseBody = {
  title?: string;
  amount?: string | number;
  category?: string;
  store?: string;
  date?: string;
  comment?: string;
};

function normalizeRole(value: unknown): AppRole {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "owner") return "owner";
  if (raw === "admin") return "admin";
  if (raw === "manager") return "manager";
  return "cashier";
}
function getSessionUser(session: unknown) {
  const user = (session as any)?.user;
  return {
    role: normalizeRole(user?.role),
    username: String(user?.username ?? "").trim(),
    store: String(user?.store ?? "").trim(),
  };
}
function getMonthRange(month: string | null) {
  const now = new Date();
  let year = now.getFullYear();
  let monthIndex = now.getMonth();
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    year = y;
    monthIndex = m - 1;
  }
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  return { start, end, year, monthIndex, monthKey: `${year}-${String(monthIndex + 1).padStart(2, "0")}` };
}
function toNumber(value: unknown): number | null { const n = Number(String(value ?? "").trim().replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) ? n : null; }
function toText(value: unknown): string { return value == null ? "" : String(value); }

async function generateRecurringExpenses(month: string) {
  const templates = await prisma.recurringExpenseTemplate.findMany({ where: { isActive: true } });
  if (!templates.length) return;

  await prisma.$transaction(async (tx) => {
    for (const template of templates) {
      const [y, m] = month.split("-").map(Number);
      const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
      const day = Math.max(1, Math.min(template.dayOfMonth, daysInMonth));
      const date = new Date(Date.UTC(y, m - 1, day, 0, 0, 0));
      await tx.expense.upsert({
        where: {
          recurringTemplateId_recurringMonth: {
            recurringTemplateId: template.id,
            recurringMonth: month,
          },
        },
        update: {},
        create: {
          title: template.title,
          amount: template.amount,
          category: template.category,
          store: template.store,
          comment: template.comment,
          date,
          recurringTemplateId: template.id,
          recurringMonth: month,
        },
      });
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = getSessionUser(await auth());
    if (!sessionUser.username) return NextResponse.json({ error: "Не авторизован." }, { status: 401 });
    if (sessionUser.role === "cashier") return NextResponse.json({ error: "У кассира нет доступа к расходам." }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const { start, end, monthKey } = getMonthRange(searchParams.get("month"));
    const requestedStore = String(searchParams.get("store") ?? "").trim();

    if (sessionUser.role === "manager" && !sessionUser.store) return NextResponse.json({ error: "У менеджера не назначен магазин." }, { status: 403 });

    await generateRecurringExpenses(monthKey);

    const enforcedStore = sessionUser.role === "manager" ? sessionUser.store : requestedStore && requestedStore !== "Все магазины" ? requestedStore : "";
    const expenses = await prisma.expense.findMany({ where: { date: { gte: start, lt: end }, ...(enforcedStore ? { store: enforcedStore } : {}) }, orderBy: [{ date: "desc" }, { id: "desc" }] });

    return NextResponse.json({ ok: true, summary: { totalAmount: expenses.reduce((s, i) => s + Number(i.amount), 0), count: expenses.length, storesCount: new Set(expenses.map((i) => i.store).filter(Boolean)).size, month: monthKey }, rows: expenses.map((item) => ({ id: item.id, title: item.title, amount: item.amount, category: item.category, store: toText(item.store), date: item.date.toISOString().slice(0, 10), comment: toText(item.comment) })) });
  } catch (error) {
    console.error("Ошибка чтения Expense:", error);
    return NextResponse.json({ error: "Не удалось прочитать расходы." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = getSessionUser(await auth());
    if (!sessionUser.username) return NextResponse.json({ error: "Не авторизован." }, { status: 401 });
    if (sessionUser.role === "cashier") return NextResponse.json({ error: "У кассира нет доступа к созданию расходов." }, { status: 403 });

    const body = (await request.json()) as ExpenseBody;
    const title = String(body.title ?? "").trim();
    const category = String(body.category ?? "").trim() || "Прочее";
    const requestedStore = String(body.store ?? "").trim();
    const store = sessionUser.role === "manager" ? sessionUser.store || null : requestedStore || null;
    const comment = String(body.comment ?? "").trim() || null;
    const amount = toNumber(body.amount);
    const dateText = String(body.date ?? "").trim();

    if (!title) return NextResponse.json({ error: "Введите название расхода." }, { status: 400 });
    if (amount === null || amount <= 0) return NextResponse.json({ error: "Введите корректную сумму расхода." }, { status: 400 });
    if (sessionUser.role === "manager" && !sessionUser.store) return NextResponse.json({ error: "У менеджера не назначен магазин." }, { status: 403 });
    if (!dateText) return NextResponse.json({ error: "Укажите дату расхода." }, { status: 400 });

    const expense = await prisma.expense.create({ data: { title, amount, category, store, comment, date: new Date(`${dateText}T00:00:00.000Z`) } });
    return NextResponse.json({ ok: true, row: { id: expense.id, title: expense.title, amount: expense.amount, category: expense.category, store: toText(expense.store), date: expense.date.toISOString().slice(0, 10), comment: toText(expense.comment) } });
  } catch (error) {
    console.error("Ошибка сохранения Expense:", error);
    return NextResponse.json({ error: "Не удалось сохранить расход." }, { status: 500 });
  }
}
