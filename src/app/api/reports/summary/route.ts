import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedStore = toText(searchParams.get("store")) || "Все магазины";
    const { start, end, monthKey } = getMonthRange(searchParams.get("month"));

    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        include: {
          saleItems: {
            select: {
              id: true,
              qty: true,
              lineTotal: true,
              store: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),

      prisma.expense.findMany({
        where: {
          date: {
            gte: start,
            lt: end,
          },
        },
        orderBy: [{ date: "desc" }, { id: "desc" }],
      }),
    ]);

    const allLines = sales.flatMap((sale) =>
      sale.saleItems.map((line) => ({
        saleId: sale.id,
        qty: line.qty,
        lineTotal: line.lineTotal,
        store: toText(line.store) || "Без магазина",
      }))
    );

    const filteredLines =
      selectedStore === "Все магазины"
        ? allLines
        : allLines.filter((line) => line.store === selectedStore);

    const revenue = filteredLines.reduce((sum, line) => sum + line.lineTotal, 0);

    const itemsSold = filteredLines.reduce((sum, line) => sum + line.qty, 0);

    const salesCount =
      selectedStore === "Все магазины"
        ? sales.length
        : new Set(filteredLines.map((line) => line.saleId)).size;

    const filteredExpenses =
      selectedStore === "Все магазины"
        ? expenses
        : expenses.filter(
            (expense) => (toText(expense.store) || "Без магазина") === selectedStore
          );

    const expensesTotal = filteredExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const profit = revenue - expensesTotal;

    const storeMap = new Map<
      string,
      {
        revenue: number;
        expenses: number;
        itemsSold: number;
        saleIds: Set<number>;
      }
    >();

    function ensureStore(storeName: string) {
      if (!storeMap.has(storeName)) {
        storeMap.set(storeName, {
          revenue: 0,
          expenses: 0,
          itemsSold: 0,
          saleIds: new Set<number>(),
        });
      }
      return storeMap.get(storeName)!;
    }

    for (const line of allLines) {
      const bucket = ensureStore(line.store);
      bucket.revenue += line.lineTotal;
      bucket.itemsSold += line.qty;
      bucket.saleIds.add(line.saleId);
    }

    for (const expense of expenses) {
      const storeName = toText(expense.store) || "Без магазина";
      const bucket = ensureStore(storeName);
      bucket.expenses += expense.amount;
    }

    let byStore = Array.from(storeMap.entries()).map(([storeName, data]) => ({
      store: storeName,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.revenue - data.expenses,
      salesCount: data.saleIds.size,
      itemsSold: data.itemsSold,
    }));

    byStore.sort((a, b) => b.revenue - a.revenue);

    if (selectedStore !== "Все магазины") {
      byStore = [
        {
          store: selectedStore,
          revenue,
          expenses: expensesTotal,
          profit,
          salesCount,
          itemsSold,
        },
      ];
    }

    return NextResponse.json({
      ok: true,
      summary: {
        month: monthKey,
        store: selectedStore,
        revenue,
        expenses: expensesTotal,
        profit,
        salesCount,
        itemsSold,
      },
      byStore,
    });
  } catch (error) {
    console.error("Ошибка чтения отчета:", error);

    return NextResponse.json(
      { error: "Не удалось построить отчет." },
      { status: 500 }
    );
  }
}