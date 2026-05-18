import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type SessionLike = {
  user?: {
    role?: unknown;
  };
} | null;

type PatchBody = {
  title?: unknown;
  amount?: unknown;
  category?: unknown;
  store?: unknown;
  comment?: unknown;
  isActive?: unknown;
  dayOfMonth?: unknown;
  startMonth?: unknown;
};

function roleOf(session: unknown) {
  return String((session as SessionLike)?.user?.role ?? "")
    .trim()
    .toLowerCase();
}

function isOwnerAdmin(session: unknown) {
  const role = roleOf(session);
  return role === "owner" || role === "admin";
}

async function parseId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return {
      errorResponse: NextResponse.json(
        { error: "Некорректный id шаблона." },
        { status: 400 }
      ),
      parsedId: null,
    };
  }

  return {
    errorResponse: null,
    parsedId,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован." }, { status: 401 });
  }

  if (!isOwnerAdmin(session)) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }

  const { errorResponse, parsedId } = await parseId(context);

  if (errorResponse) {
    return errorResponse;
  }

  if (parsedId === null) {
    return NextResponse.json(
      { error: "Некорректный id шаблона." },
      { status: 400 }
    );
  }

  try {
    const body = (await request.json()) as PatchBody;

    const data: {
      title?: string;
      category?: string;
      store?: string | null;
      comment?: string | null;
      isActive?: boolean;
      amount?: number;
      dayOfMonth?: number;
      startMonth?: string;
    } = {};

    if (body.title !== undefined) {
      data.title = String(body.title ?? "").trim();
    }

    if (body.category !== undefined) {
      data.category = String(body.category ?? "").trim();
    }

    if (body.store !== undefined) {
      const storeText = String(body.store ?? "").trim();
      data.store = storeText === "" ? null : storeText;
    }

    if (body.comment !== undefined) {
      const commentText = String(body.comment ?? "").trim();
      data.comment = commentText === "" ? null : commentText;
    }

    if (typeof body.isActive === "boolean") {
      data.isActive = body.isActive;
    }

    const amountText = String(body.amount ?? "")
      .trim()
      .replace(/\s/g, "")
      .replace(",", ".");

    if (body.amount !== undefined && amountText !== "") {
      const amount = Number(amountText);

      if (!Number.isFinite(amount) || amount < 0) {
        throw new Error("Некорректная сумма шаблона.");
      }

      data.amount = amount;
    }

    const dayText = String(body.dayOfMonth ?? "").trim();

    if (body.dayOfMonth !== undefined && dayText !== "") {
      const dayOfMonth = Number(dayText);

      if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
        throw new Error("Некорректный день месяца.");
      }

      data.dayOfMonth = dayOfMonth;
    }


    if (body.startMonth !== undefined) {
      const startMonthText = String(body.startMonth ?? "").trim();

      if (!/^\d{4}-\d{2}$/.test(startMonthText)) {
        throw new Error("startMonth должен быть в формате YYYY-MM.");
      }

      data.startMonth = startMonthText;
    }

    const row = await prisma.recurringExpenseTemplate.update({
      where: { id: parsedId },
      data,
    });

    return NextResponse.json({ ok: true, row });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Ошибка обновления шаблона.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован." }, { status: 401 });
  }

  if (!isOwnerAdmin(session)) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }

  const { errorResponse, parsedId } = await parseId(context);

  if (errorResponse) {
    return errorResponse;
  }

  if (parsedId === null) {
    return NextResponse.json(
      { error: "Некорректный id шаблона." },
      { status: 400 }
    );
  }

  try {
    await prisma.recurringExpenseTemplate.delete({
      where: { id: parsedId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Ошибка удаления шаблона.",
      },
      { status: 400 }
    );
  }
}