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
  { params }: { params: Promise<{ id: string }> }
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

    if (sessionUser.role === "cashier" && !sessionUser.store) {
      return NextResponse.json(
        { error: "У кассира не назначен магазин." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const saleId = Number(id);

    if (!Number.isFinite(saleId)) {
      return NextResponse.json(
        { error: "Некорректный id продажи." },
        { status: 400 }
      );
    }

    const cancelledSale = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: {
          saleItems: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!sale) {
        return null;
      }

      if (sessionUser.role === "cashier") {
        const hasForeignStoreItem = sale.saleItems.some(
          (item) => String(item.store ?? "").trim() !== sessionUser.store
        );

        if (hasForeignStoreItem) {
          throw new Error("Кассир не может отменять продажу чужого магазина.");
        }
      }

      for (const item of sale.saleItems) {
        if (item.product && item.product.stockQty !== null) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQty: {
                increment: item.qty,
              },
            },
          });
        }
      }

      await tx.saleItem.deleteMany({
        where: { saleId },
      });

      await tx.sale.delete({
        where: { id: saleId },
      });

      return {
        id: sale.id,
        total: sale.total,
        itemsCount: sale.saleItems.reduce((sum, item) => sum + item.qty, 0),
      };
    });

    if (!cancelledSale) {
      return NextResponse.json(
        { error: "Продажа не найдена." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      cancelledSale,
    });
  } catch (error) {
    console.error("Ошибка отмены Sale:", error);

    const message =
      error instanceof Error ? error.message : "Не удалось отменить продажу.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}