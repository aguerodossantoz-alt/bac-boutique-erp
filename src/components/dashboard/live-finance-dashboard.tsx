"use client";

import { useEffect, useState } from "react";

type StoreSummary = {
  store: string;
  revenue: number;
  estimatedCost: number;
  expenses: number;
  netProfit: number;
};

type RecentSale = {
  id: number;
  total: number;
  createdAt: string;
  itemsCount: number;
};

type FinanceSummary = {
  ok: boolean;
  month: string;
  revenue: number;
  estimatedCost: number;
  expenses: number;
  grossProfit: number;
  totalProfit: number;
  netProfit: number;
  salesCount: number;
  expensesCount: number;
  saleLinesWithPurchasePrice: number;
  totalSaleLines: number;
  byStore: StoreSummary[];
  recentSales: RecentSale[];
};

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function LiveFinanceDashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [message, setMessage] = useState("");

  async function loadSummary() {
    try {
      setMessage("");

      const response = await fetch(`/api/finance/summary?month=${month}`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Не удалось загрузить сводку.");
      }

      setSummary(result as FinanceSummary);
    } catch (error) {
      console.error("Ошибка загрузки сводки:", error);
      setMessage(error instanceof Error ? error.message : "Ошибка загрузки сводки.");
      setSummary(null);
    }
  }

  useEffect(() => {
    loadSummary();
  }, [month]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Финансовая картина хозяина
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Живая сводка по бутику
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
              Здесь считаются продажи, расходы, оценочная себестоимость и
              ориентировочная прибыль по выбранному месяцу.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none"
            />
            <button
              type="button"
              onClick={loadSummary}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white transition hover:bg-white/[0.08]"
            >
              Обновить
            </button>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            {message}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
            <div className="text-sm text-zinc-500">Выручка</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {formatMoney(summary?.revenue || 0)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
            <div className="text-sm text-zinc-500">Оценочная себестоимость</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {formatMoney(summary?.estimatedCost || 0)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
            <div className="text-sm text-zinc-500">Расходы</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {formatMoney(summary?.expenses || 0)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
            <div className="text-sm text-zinc-500">Валовая прибыль</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {formatMoney(summary?.grossProfit || 0)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
            <div className="text-sm text-zinc-500">Прибыль (розница - закупка)</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {formatMoney(summary?.totalProfit || 0)}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-[#090909] p-4 text-sm text-zinc-300">
          Количество продаж за месяц: <span className="font-semibold text-white">{summary?.salesCount || 0}</span>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-[#090909] p-4 text-sm text-zinc-300">
          Закупочная цена заполнена у {summary?.saleLinesWithPurchasePrice || 0} из{" "}
          {summary?.totalSaleLines || 0} проданных строк за выбранный месяц. Пока
          закупка не везде заполнена, прибыль остается оценочной.
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            По магазинам
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Сводка по точкам
          </h2>

          <div className="mt-5 space-y-3">
            {(summary?.byStore || []).map((store) => (
              <div
                key={store.store}
                className="rounded-2xl border border-white/10 bg-[#090909] p-4"
              >
                <div className="text-lg font-medium text-white">{store.store}</div>
                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  <div>
                    <div className="text-sm text-zinc-500">Выручка</div>
                    <div className="mt-1 text-white">{formatMoney(store.revenue)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">Себестоимость</div>
                    <div className="mt-1 text-white">
                      {formatMoney(store.estimatedCost)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">Расходы</div>
                    <div className="mt-1 text-white">{formatMoney(store.expenses)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">Чистая прибыль</div>
                    <div className="mt-1 text-white">
                      {formatMoney(store.netProfit)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {(summary?.byStore || []).length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#090909] p-4 text-sm text-zinc-500">
                По выбранному месяцу данных пока нет.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Продажи месяца
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Последние чеки
          </h2>

          <div className="mt-5 space-y-3">
            {(summary?.recentSales || []).map((sale) => (
              <div
                key={sale.id}
                className="rounded-2xl border border-white/10 bg-[#090909] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-zinc-500">
                      {formatDate(sale.createdAt)}
                    </div>
                    <div className="mt-1 text-lg font-medium text-white">
                      Продажа #{sale.id}
                    </div>
                    <div className="mt-1 text-sm text-zinc-300">
                      Позиций: {sale.itemsCount}
                    </div>
                  </div>

                  <div className="text-lg font-semibold text-white">
                    {formatMoney(sale.total)}
                  </div>
                </div>
              </div>
            ))}

            {(summary?.recentSales || []).length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#090909] p-4 text-sm text-zinc-500">
                Продаж пока нет.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
