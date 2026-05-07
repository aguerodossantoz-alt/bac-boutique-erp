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

function toStore(value: string | null | undefined) {
  return value?.trim() || "Без магазина";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { start, end, monthKey } = getMonthRange(searchParams.get("month"));

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        saleItems: {
          include: {
            product: true,
          },
        },
      },
    });

    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { date: "desc" },
    });

    const revenue = sales.reduce((sum: number, sale: any) => sum + sale.total, 0);

    let estimatedCost = 0;
    let totalProfit = 0;
    let saleLinesWithPurchasePrice = 0;
    let totalSaleLines = 0;

    const storeMap = new Map<
      string,
      {
        store: string;
        revenue: number;
        estimatedCost: number;
        expenses: number;
      }
    >();

    for (const sale of sales) {
      for (const item of sale.saleItems) {
        totalSaleLines += 1;

        const store = toStore(item.store || item.product?.store);
        const current = storeMap.get(store) || {
          store,
          revenue: 0,
          estimatedCost: 0,
          expenses: 0,
        };

        current.revenue += item.lineTotal;

        const purchasePrice = item.product?.purchasePrice;
        const retailPrice = item.product?.retailPrice;

        if (purchasePrice !== null && purchasePrice !== undefined) {
          const lineCost = purchasePrice * item.qty;
          estimatedCost += lineCost;
          current.estimatedCost += lineCost;
          saleLinesWithPurchasePrice += 1;
        }

        if (
          purchasePrice !== null &&
          purchasePrice !== undefined &&
          retailPrice !== null &&
          retailPrice !== undefined
        ) {
          totalProfit += (retailPrice - purchasePrice) * item.qty;
        }

        storeMap.set(store, current);
      }
    }

    let expensesTotal = 0;

    for (const expense of expenses) {
      expensesTotal += expense.amount;

      const store = toStore(expense.store);
      const current = storeMap.get(store) || {
        store,
        revenue: 0,
        estimatedCost: 0,
        expenses: 0,
      };

      current.expenses += expense.amount;
      storeMap.set(store, current);
    }

    const grossProfit = revenue - estimatedCost;
    const netProfit = grossProfit - expensesTotal;

    const byStore = Array.from(storeMap.values()).map((item: any) => ({
      store: item.store,
      revenue: item.revenue,
      estimatedCost: item.estimatedCost,
      expenses: item.expenses,
      netProfit: item.revenue - item.estimatedCost - item.expenses,
    }));

    return NextResponse.json({
      ok: true,
      month: monthKey,
      revenue,
      estimatedCost,
      expenses: expensesTotal,
      grossProfit,
      totalProfit,
      netProfit,
      salesCount: sales.length,
      expensesCount: expenses.length,
      saleLinesWithPurchasePrice,
      totalSaleLines,
      byStore,
      recentSales: sales.slice(0, 10).map((sale: any) => ({
        id: sale.id,
        total: sale.total,
        createdAt: sale.createdAt.toISOString(),
        itemsCount: sale.saleItems.reduce((sum: number, item: any) => sum + item.qty, 0),
      })),
    });
  } catch (error) {
    console.error("Ошибка финансовой сводки:", error);

    return NextResponse.json(
      { error: "Не удалось собрать финансовую сводку." },
      { status: 500 }
    );
  }
}
