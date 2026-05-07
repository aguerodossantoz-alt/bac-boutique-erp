import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type AppRole = "owner" | "admin" | "cashier";

type SaleRequestItem = {
  productId?: number;
  barcode?: string;
  qty?: number | string;
  unitPrice?: number | string;
  store?: string;
};

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

function toNumber(value: unknown): number | null {
  const text = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!text) return null;

  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : null;
}

function toPositiveInt(value: unknown): number | null {
  const numeric = toNumber(value);
  if (numeric === null) return null;

  const intValue = Math.trunc(numeric);
  return intValue > 0 ? intValue : null;
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

    const { searchParams } = new URL(request.url);
    const requestedStore = String(searchParams.get("store") ?? "").trim();

    let where:
      | {
          saleItems?: {
            some: {
              store: string;
            };
          };
        }
      | undefined;

    if (sessionUser.role === "cashier") {
      if (!sessionUser.store) {
        return NextResponse.json(
          { error: "У кассира не назначен магазин." },
          { status: 403 }
        );
      }

      where = {
        saleItems: {
          some: { store: sessionUser.store },
        },
      };
    } else {
      where =
        requestedStore && requestedStore !== "Все магазины"
          ? {
              saleItems: {
                some: { store: requestedStore },
              },
            }
          : undefined;
    }

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        saleItems: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      rows: sales.map((sale) => ({
        id: sale.id,
        total: sale.total,
        createdAt: sale.createdAt.toISOString(),
        itemsCount: sale.saleItems.reduce((sum: number, item: any) => sum + item.qty, 0),
        lines: sale.saleItems.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          barcode: toText(item.product?.barcode),
          name: toText(item.product?.name),
          qty: item.qty,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          store: toText(item.store),
        })),
      })),
    });
  } catch (error) {
    console.error("Ошибка чтения Sale:", error);

    return NextResponse.json(
      { error: "Не удалось прочитать продажи." },
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

    if (sessionUser.role === "cashier" && !sessionUser.store) {
      return NextResponse.json(
        { error: "У кассира не назначен магазин." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const items = Array.isArray(body?.items)
      ? (body.items as SaleRequestItem[])
      : [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Чек пустой." },
        { status: 400 }
      );
    }

    const sale = await prisma.$transaction(async (tx: any) => {
      const resolvedItems: Array<{
        productId: number;
        barcode: string;
        name: string;
        qty: number;
        unitPrice: number;
        lineTotal: number;
        store: string | null;
        stockQty: number | null;
      }> = [];

      for (const rawItem of items) {
        const qty = toPositiveInt(rawItem.qty);

        if (!qty) {
          throw new Error("Некорректное количество в чеке.");
        }

        const rawStore = String(rawItem.store ?? "").trim();

        let product: any = null;

        if (rawItem.productId && Number.isInteger(rawItem.productId)) {
          product = await tx.product.findUnique({
            where: { id: Number(rawItem.productId) },
          });
        } else {
          const barcode = String(rawItem.barcode ?? "").trim();

          if (!barcode) {
            throw new Error("Не передан barcode или productId.");
          }

          if (sessionUser.role === "cashier") {
            product = await tx.product.findFirst({
              where: {
                barcode,
                store: sessionUser.store,
              },
            });
          } else if (rawStore && rawStore !== "Все магазины") {
            product = await tx.product.findFirst({
              where: {
                barcode,
                store: rawStore,
              },
            });
          } else {
            product = await tx.product.findFirst({
              where: { barcode },
            });
          }
        }

        if (!product) {
          throw new Error("Один из товаров не найден в Product.");
        }

        if (sessionUser.role === "cashier" && product.store !== sessionUser.store) {
          throw new Error("Кассир не может продавать товар чужого магазина.");
        }

        if (product.itemStatus !== "READY_FOR_SALE") {
          throw new Error(`Товар "${product.name}" не готов к продаже.`);
        }

        if (product.stockQty !== null && product.stockQty < qty) {
          throw new Error(`Недостаточно остатка у товара "${product.name}".`);
        }

        const unitPrice =
          toNumber(rawItem.unitPrice) ??
          product.promoPrice ??
          product.retailPrice ??
          0;

        if (unitPrice <= 0) {
          throw new Error(`У товара "${product.name}" нет корректной цены продажи.`);
        }

        const lineStore =
          sessionUser.role === "cashier"
            ? sessionUser.store
            : rawStore || product.store || null;

        const lineTotal = unitPrice * qty;

        resolvedItems.push({
          productId: product.id,
          barcode: product.barcode,
          name: product.name,
          qty,
          unitPrice,
          lineTotal,
          store: lineStore,
          stockQty: product.stockQty,
        });
      }

      const total = resolvedItems.reduce((sum: number, item: any) => sum + item.lineTotal, 0);

      const createdSale = await tx.sale.create({
        data: {
          total,
          saleItems: {
            create: resolvedItems.map((item: any) => ({
              productId: item.productId,
              qty: item.qty,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              store: item.store,
            })),
          },
        },
        include: {
          saleItems: {
            include: {
              product: true,
            },
          },
        },
      });

      for (const item of resolvedItems) {
        if (item.stockQty !== null) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQty: {
                decrement: item.qty,
              },
            },
          });
        }
      }

      return createdSale;
    });

    return NextResponse.json({
      ok: true,
      sale: {
        id: sale.id,
        total: sale.total,
        createdAt: sale.createdAt.toISOString(),
        itemsCount: sale.saleItems.reduce((sum: number, item: any) => sum + item.qty, 0),
      },
    });
  } catch (error) {
    console.error("Ошибка сохранения Sale:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Не удалось завершить продажу.";

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}