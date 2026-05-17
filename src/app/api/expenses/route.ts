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
  const user = (session as
    | {
        user?: {
          role?: unknown;
          username?: unknown;
          store?: unknown;
        };
      }
    | null)?.user;

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

  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  return { start, end, monthKey };
}

function toNumber(value: unknown): number | null {
  const text = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!text) return null;

  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : null;
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const sessionUser = getSessionUser(session);

    if (
      !(session as { user?: unknown } | null)?.user ||
      !sessionUser.username
    ) {
      return NextResponse.json(
        { error: "Не авторизован." },
        { status: 401 }
      );
    }

    if (sessionUser.role === "cashier") {
      return NextResponse.json(
        { error: "У кассира нет доступа к расходам." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const { start, end, monthKey } = getMonthRange(searchParams.get("month"));
    const requestedStore = String(searchParams.get("store") ?? "").trim();

    if (sessionUser.role === "manager" && !sessionUser.store) {
      return NextResponse.json(
        { error: "У менеджера не назначен магазин." },
        { status: 403 }
      );
    }

    const enforcedStore =
      sessionUser.role === "manager"
        ? sessionUser.store
        : requestedStore && requestedStore !== "Все магазины"
        ? requestedStore
        : "";

    const where = {
      date: {
        gte: start,
        lt: end,
      },
      ...(enforcedStore ? { store: enforcedStore } : {}),
    };

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: [{ date: "desc" }, { id: "desc" }],
    });

    const totalAmount = expenses.reduce(
      (sum: number, item: any) => sum + Number(item.amount),
      0
    );
    const storesCount = new Set(
      expenses.map((item: any) => item.store).filter(Boolean)
    ).size;

    return NextResponse.json({
      ok: true,
      summary: {
        totalAmount,
        count: expenses.length,
        storesCount,
        month: monthKey,
      },
      rows: expenses.map((item: any) => ({
        id: item.id,
        title: item.title,
        amount: item.amount,
        category: item.category,
        store: toText(item.store),
        date: item.date.toISOString().slice(0, 10),
        comment: toText(item.comment),
      })),
    });
  } catch (error) {
    console.error("Ошибка чтения Expense:", error);

    return NextResponse.json(
      { error: "Не удалось прочитать расходы." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const sessionUser = getSessionUser(session);

    if (
      !(session as { user?: unknown } | null)?.user ||
      !sessionUser.username
    ) {
      return NextResponse.json(
        { error: "Не авторизован." },
        { status: 401 }
      );
    }

    if (sessionUser.role === "cashier") {
      return NextResponse.json(
        { error: "У кассира нет доступа к созданию расходов." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as ExpenseBody;

    const title = String(body.title ?? "").trim();
    const category = String(body.category ?? "").trim() || "Прочее";
    const requestedStore = String(body.store ?? "").trim();
    const store =
      sessionUser.role === "manager"
        ? sessionUser.store || null
        : requestedStore || null;
    const comment = String(body.comment ?? "").trim() || null;
    const amount = toNumber(body.amount);
    const dateText = String(body.date ?? "").trim();

    if (!title) {
      return NextResponse.json(
        { error: "Введите название расхода." },
        { status: 400 }
      );
    }

    if (amount === null || amount <= 0) {
      return NextResponse.json(
        { error: "Введите корректную сумму расхода." },
        { status: 400 }
      );
    }

    if (sessionUser.role === "manager" && !sessionUser.store) {
      return NextResponse.json(
        { error: "У менеджера не назначен магазин." },
        { status: 403 }
      );
    }

    if (!dateText) {
      return NextResponse.json(
        { error: "Укажите дату расхода." },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        amount,
        category,
        store,
        comment,
        date: new Date(`${dateText}T00:00:00.000Z`),
      },
    });

    return NextResponse.json({
      ok: true,
      row: {
        id: expense.id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        store: toText(expense.store),
        date: expense.date.toISOString().slice(0, 10),
        comment: toText(expense.comment),
      },
    });
  } catch (error) {
    console.error("Ошибка сохранения Expense:", error);

    return NextResponse.json(
      { error: "Не удалось сохранить расход." },
      { status: 500 }
    );
  }
}
