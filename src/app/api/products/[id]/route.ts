import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toNullableString(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function toNullableFloat(value: unknown): number | null {
  const text = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!text) return null;

  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : null;
}

function toNullableInt(value: unknown): number | null {
  const text = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!text) return null;

  const numeric = Number(text);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
}

function toText(value: unknown): string {
  return value == null ? "" : String(value);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isFinite(productId)) {
      return NextResponse.json(
        { error: "Некорректный id товара." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const barcode = String(body?.barcode ?? "").trim();
    const name = String(body?.name ?? "").trim();
    const store = toNullableString(body?.store);

    if (!barcode || !name) {
      return NextResponse.json(
        { error: "У товара должны быть barcode и name." },
        { status: 400 }
      );
    }

    const duplicateProduct = await prisma.product.findFirst({
      where: {
        barcode,
        store,
        NOT: {
          id: productId,
        },
      },
    });

    if (duplicateProduct) {
      return NextResponse.json(
        { error: "В этом магазине уже есть другой товар с таким штрихкодом." },
        { status: 409 }
      );
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        barcode,
        name,
        article: toNullableString(body.article),
        promoPrice: toNullableFloat(body.promo_price),
        purchasePrice: toNullableFloat(body.purchase_price),
        retailPrice: toNullableFloat(body.retail_price),
        stockQty: toNullableInt(body.stock_qty),
        store,
        itemStatus: String(body.item_status ?? "").trim() || "READY_FOR_SALE",
        imageUrl: toNullableString(body.image_url),
      },
    });

    return NextResponse.json({
      ok: true,
      row: {
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
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/products/[id] error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Ошибка сохранения товара.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isFinite(productId)) {
      return NextResponse.json(
        { error: "Некорректный id товара." },
        { status: 400 }
      );
    }

    const usedInSales = await prisma.saleItem.count({
      where: { productId },
    });

    if (usedInSales > 0) {
      return NextResponse.json(
        { error: "Нельзя удалить товар, который уже участвовал в продажах." },
        { status: 409 }
      );
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Ошибка удаления Product:", error);

    return NextResponse.json(
      {
        error: error?.message || "Не удалось удалить товар.",
      },
      { status: 500 }
    );
  }
}