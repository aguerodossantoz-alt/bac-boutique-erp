import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type AppRole = "owner" | "admin" | "cashier";

function normalizeRole(value: unknown): AppRole {
  const raw = String(value ?? "").trim().toLowerCase();

  if (raw === "owner") return "owner";
  if (raw === "admin") return "admin";
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

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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
        { error: "У кассира нет доступа к удалению расходов." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const expenseId = Number(id);

    if (!Number.isInteger(expenseId) || expenseId <= 0) {
      return NextResponse.json(
        { error: "Некорректный id расхода." },
        { status: 400 }
      );
    }

    const existingExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Расход не найден." },
        { status: 404 }
      );
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Ошибка удаления Expense:", error);

    return NextResponse.json(
      { error: "Не удалось удалить расход." },
      { status: 500 }
    );
  }
}