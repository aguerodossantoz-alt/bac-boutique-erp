import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ImportRow = {
  barcode: string;
  name: string;
  article: string;
  promo_price: string;
  purchase_price: string;
  retail_price: string;
  stock_qty: string;
  store: string;
  item_status: string;
};

function toNullableString(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function toNullableFloat(value: unknown): number | null {
  const text = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  if (!text) return null;

  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : null;
}

function toNullableInt(value: unknown): number | null {
  const text = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  if (!text) return null;

  const numeric = Number(text);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rows = Array.isArray(body?.rows) ? (body.rows as ImportRow[]) : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Нет строк для импорта." },
        { status: 400 }
      );
    }

    let importedCount = 0;

    for (const row of rows) {
      const barcode = String(row.barcode ?? "").trim();
      const name = String(row.name ?? "").trim();

      if (!barcode || !name) {
        continue;
      }

      await prisma.product.upsert({
        where: { barcode },
        update: {
          name,
          article: toNullableString(row.article),
          promoPrice: toNullableFloat(row.promo_price),
          purchasePrice: toNullableFloat(row.purchase_price),
          retailPrice: toNullableFloat(row.retail_price),
          stockQty: toNullableInt(row.stock_qty),
          store: toNullableString(row.store),
          itemStatus: String(row.item_status ?? "").trim() || "READY_FOR_SALE",
        },
        create: {
          barcode,
          name,
          article: toNullableString(row.article),
          promoPrice: toNullableFloat(row.promo_price),
          purchasePrice: toNullableFloat(row.purchase_price),
          retailPrice: toNullableFloat(row.retail_price),
          stockQty: toNullableInt(row.stock_qty),
          store: toNullableString(row.store),
          itemStatus: String(row.item_status ?? "").trim() || "READY_FOR_SALE",
        },
      });

      importedCount += 1;
    }

    return NextResponse.json({
      ok: true,
      importedCount,
    });
  } catch (error) {
    console.error("Ошибка импорта Product:", error);

    return NextResponse.json(
      { error: "Не удалось импортировать товары в Product." },
      { status: 500 }
    );
  }
}