import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type AppRole = "owner" | "admin" | "manager" | "cashier";

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

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

function toNumber(value: string) {
  const text = value.replace(/\s/g, "").replace(",", ".");
  if (!text) return null;

  const num = Number(text);
  return Number.isFinite(num) ? num : null;
}

function toInt(value: string) {
  const text = value.replace(/\s/g, "").replace(",", ".");
  if (!text) return null;

  const num = Number(text);
  return Number.isFinite(num) ? Math.trunc(num) : null;
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
          store?: string;
        }
      | undefined;

    if (sessionUser.role === "cashier") {
      if (!sessionUser.store) {
        return NextResponse.json(
          { error: "У кассира не назначен магазин." },
          { status: 403 }
        );
      }

      where = { store: sessionUser.store };
    } else if (sessionUser.role === "manager") {
      if (!sessionUser.store) {
        return NextResponse.json(
          { error: "У менеджера не назначен магазин." },
          { status: 403 }
        );
      }
      where = { store: sessionUser.store };
    } else {
      where =
        requestedStore && requestedStore !== "Все магазины"
          ? { store: requestedStore }
          : undefined;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { id: "asc" },
    });

    const rows = products.map((product) => ({
      id: product.id,
      barcode: toText(product.barcode),
      name: toText(product.name),
      article: toText(product.article),
      promo_price:
        product.promoPrice === null ? "" : toText(product.promoPrice),
      purchase_price:
        product.purchasePrice === null ? "" : toText(product.purchasePrice),
      retail_price:
        product.retailPrice === null ? "" : toText(product.retailPrice),
      stock_qty: product.stockQty === null ? "" : toText(product.stockQty),
      store: toText(product.store),
      item_status: toText(product.itemStatus || "READY_FOR_SALE"),
      image_url: toText(product.imageUrl),
    }));

    return NextResponse.json({
      ok: true,
      rows,
    });
  } catch (error) {
    console.error("Ошибка чтения Product:", error);

    return NextResponse.json(
      { error: "Не удалось прочитать Product." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
        { error: "У кассира нет доступа к созданию товаров." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const requestedStore = String(body?.store ?? "").trim();

    if (sessionUser.role === "manager" && !sessionUser.store) {
      return NextResponse.json(
        { error: "У менеджера не назначен магазин." },
        { status: 403 }
      );
    }

    const barcode = String(body?.barcode ?? "").trim();
    const article = String(body?.article ?? "").trim();
    const name = String(body?.name ?? "").trim();
    const promoPriceRaw = String(body?.promo_price ?? "").trim();
    const purchasePriceRaw = String(body?.purchase_price ?? "").trim();
    const retailPriceRaw = String(body?.retail_price ?? "").trim();
    const stockQtyRaw = String(body?.stock_qty ?? "").trim();
    const store =
      sessionUser.role === "manager"
        ? sessionUser.store
        : requestedStore || "Магазин 1";
    const itemStatus =
      String(body?.item_status ?? "").trim() || "READY_FOR_SALE";

    if (!barcode) {
      return NextResponse.json(
        { error: "Заполни штрихкод." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Заполни название." },
        { status: 400 }
      );
    }

    const promoPrice = toNumber(promoPriceRaw);
    const purchasePrice = toNumber(purchasePriceRaw);
    const retailPrice = toNumber(retailPriceRaw);
    const stockQty = stockQtyRaw ? toInt(stockQtyRaw) : 0;

    const existingProduct = await prisma.product.findFirst({
      where: {
        barcode,
        store,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Товар с таким штрихкодом уже есть в этом магазине." },
        { status: 409 }
      );
    }

    const created = await prisma.product.create({
      data: {
        barcode,
        article: article || null,
        name,
        promoPrice,
        purchasePrice,
        retailPrice,
        stockQty,
        store,
        imageUrl: body.image_url ? String(body.image_url).trim() || null : null,
        itemStatus,
      },
    });

    return NextResponse.json({
      ok: true,
      row: {
        id: created.id,
        barcode: created.barcode,
        article: created.article ?? "",
        name: created.name,
        promo_price: created.promoPrice ?? "",
        purchase_price: created.purchasePrice ?? "",
        retail_price: created.retailPrice ?? "",
        stock_qty: created.stockQty ?? "",
        store: created.store ?? "",
        item_status: created.itemStatus,
        image_url: created.imageUrl ?? "",
      },
    });
  } catch (error) {
    console.error("Ошибка создания Product:", error);

    return NextResponse.json(
      { error: "Не удалось создать товар." },
      { status: 500 }
    );
  }
}
