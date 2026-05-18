import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function roleOf(session: unknown) {
  return String((session as { user?: { role?: unknown } } | null)?.user?.role ?? "")
    .trim()
    .toLowerCase();
}

function isOwnerAdmin(session: unknown) {
  const role = roleOf(session);
  return role === "owner" || role === "admin";
}

function nextMonthFromNow() {
  const now = new Date();
  const nextMonthDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );

  return `${nextMonthDate.getUTCFullYear()}-${String(
    nextMonthDate.getUTCMonth() + 1
  ).padStart(2, "0")}`;
}

function isMonthText(value: unknown) {
  return /^\d{4}-\d{2}$/.test(String(value ?? "").trim());
}

function parseMoney(value: unknown) {
  const text = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  const amount = Number(text);

  return { text, amount };
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован." }, { status: 401 });
  }

  if (!isOwnerAdmin(session)) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }

  const rows = await prisma.recurringExpenseTemplate.findMany({
    orderBy: [{ id: "desc" }],
  });

  return NextResponse.json({ ok: true, rows });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован." }, { status: 401 });
  }

  if (!isOwnerAdmin(session)) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }

  const body = await request.json();

  const title = String(body.title ?? "").trim();
  const category = String(body.category ?? "Прочее").trim() || "Прочее";
  const store = String(body.store ?? "").trim() || null;
  const comment = String(body.comment ?? "").trim() || null;

  const { text: amountText, amount } = parseMoney(body.amount);

  if (!title) {
    return NextResponse.json(
      { error: "Введите название шаблона." },
      { status: 400 }
    );
  }

  if (!amountText || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Введите корректную сумму шаблона." },
      { status: 400 }
    );
  }

  const dayOfMonth = Number(body.dayOfMonth ?? 1);

  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    return NextResponse.json(
      { error: "Некорректный день месяца." },
      { status: 400 }
    );
  }

  const rawStartMonth = String(body.startMonth ?? "").trim();

  let startMonth = nextMonthFromNow();

  if (rawStartMonth) {
    if (!isMonthText(rawStartMonth)) {
      return NextResponse.json(
        { error: "startMonth должен быть в формате YYYY-MM." },
        { status: 400 }
      );
    }

    startMonth = rawStartMonth;
  }

  const row = await prisma.recurringExpenseTemplate.create({
    data: {
      title,
      amount,
      category,
      store,
      comment,
      dayOfMonth,
      isActive: typeof body.isActive === "boolean" ? body.isActive : true,
      startMonth,
    },
  });

  return NextResponse.json({ ok: true, row });
}
