import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type AppRole = "owner" | "admin" | "manager" | "cashier";

type CommitItem = {
  productId?: number;
  factQty?: number | string;
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

function toNonNegativeInt(value: unknown): number | null {
  const text = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!text && text !== "0") return null;

  const numeric = Number(text);
  if (!Number.isFinite(numeric)) return null;

  const intValue = Math.trunc(numeric);
  return intValue >= 0 ? intValue : null;
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
        { error: "У кассира нет доступа к завершению инвентаризации." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const items = Array.isArray(body?.items) ? (body.items as CommitItem[]) : [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Нет строк для завершения инвентаризации." },
        { status: 400 }
      );
    }

    let updatedCount = 0;

    await prisma.$transaction(async (tx: any) => {
      for (const item of items) {
        const productId = Number(item.productId);
        const factQty = toNonNegativeInt(item.factQty);

        if (!Number.isInteger(productId) || productId <= 0) {
          throw new Error("Некорректный productId в инвентаризации.");
        }

        if (factQty === null) {
          throw new Error("Некорректное фактическое количество.");
        }

        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error(`Товар с id ${productId} не найден.`);
        }

        if (sessionUser.role === "manager" && product.store !== sessionUser.store) {
          throw new Error("Менеджер не может обновлять остатки чужого магазина.");
        }

        await tx.product.update({
          where: { id: productId },
          data: {
            stockQty: factQty,
          },
        });

        updatedCount += 1;
      }
    });

    return NextResponse.json({
      ok: true,
      updatedCount,
    });
  } catch (error) {
    console.error("Ошибка завершения инвентаризации:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Не удалось завершить инвентаризацию.";

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
