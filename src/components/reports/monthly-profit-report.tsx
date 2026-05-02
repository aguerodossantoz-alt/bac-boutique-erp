"use client";

import { useEffect, useState } from "react";

type Summary = {
  month: string;
  store: string;
  revenue: number;
  expenses: number;
  profit: number;
  salesCount: number;
  itemsSold: number;
};

type StoreSummary = {
  store: string;
  revenue: number;
  expenses: number;
  profit: number;
  salesCount: number;
  itemsSold: number;
};

type ReportResponse = {
  ok: boolean;
  summary: Summary;
  byStore: StoreSummary[];
};

const STORE_OPTIONS = ["Все магазины", "Магазин 1", "Магазин 2"];

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

export function MonthlyProfitReport() {
  const [month, setMonth] = useState(currentMonth());
  const [storeFilter, setStoreFilter] = useState("Все магазины");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [byStore, setByStore] = useState<StoreSummary[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function loadReport() {
    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch(
        `/api/reports/summary?month=${month}&store=${encodeURIComponent(storeFilter)}`,
        { cache: "no-store" }
      );

      const result = (await response.json()) as ReportResponse | { error?: string };

      if (!response.ok) {
        throw new Error("error" in result ? result.error || "Ошибка загрузки отчета." : "Ошибка загрузки отчета.");
      }

      if (!("summary" in result)) return;

      setSummary(result.summary);
      setByStore(Array.isArray(result.byStore) ? result.byStore : []);
    } catch (error) {
      console.error("Ошибка загрузки отчета:", error);
      setSummary(null);
      setByStore([]);
      setMessage(error instanceof Error ? error.message : "Ошибка загрузки отчета.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, [month, storeFilter]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Отчеты / Финансы
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Выручка, расходы и результат за месяц
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
              Это текущий MVP-отчет. Сейчас результат считается как выручка минус расходы.
              Себестоимость продаж пока отдельно не вычитается.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-sm text-white outline-none"
            />

            <select
              value={storeFilter}
              onChange={(event) => setStoreFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-sm text-white outline-none"
            >
              {STORE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            {message}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
          <div className="text-sm text-zinc-500">Выручка</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {summary ? formatMoney(summary.revenue) : "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
          <div className="text-sm text-zinc-500">Расходы</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {summary ? formatMoney(summary.expenses) : "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
          <div className="text-sm text-zinc-500">Результат</div>
          <div
            className={`mt-2 text-3xl font-semibold ${
              summary && summary.profit < 0 ? "text-red-300" : "text-emerald-300"
            }`}
          >
            {summary ? formatMoney(summary.profit) : "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
          <div className="text-sm text-zinc-500">Продаж</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {summary ? summary.salesCount : "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
          <div className="text-sm text-zinc-500">Продано позиций</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {summary ? summary.itemsSold : "—"}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Детализация
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          По магазинам
        </h2>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-white/[0.04] text-zinc-400">
              <tr>
                <th className="px-4 py-4 font-medium">Магазин</th>
                <th className="px-4 py-4 font-medium">Выручка</th>
                <th className="px-4 py-4 font-medium">Расходы</th>
                <th className="px-4 py-4 font-medium">Результат</th>
                <th className="px-4 py-4 font-medium">Продаж</th>
                <th className="px-4 py-4 font-medium">Позиций</th>
              </tr>
            </thead>

            <tbody>
              {byStore.map((row) => (
                <tr
                  key={row.store}
                  className="border-t border-white/10 bg-[#090909]"
                >
                  <td className="px-4 py-4 text-white">{row.store}</td>
                  <td className="px-4 py-4 text-zinc-300">
                    {formatMoney(row.revenue)}
                  </td>
                  <td className="px-4 py-4 text-zinc-300">
                    {formatMoney(row.expenses)}
                  </td>
                  <td
                    className={`px-4 py-4 ${
                      row.profit < 0 ? "text-red-300" : "text-emerald-300"
                    }`}
                  >
                    {formatMoney(row.profit)}
                  </td>
                  <td className="px-4 py-4 text-zinc-300">{row.salesCount}</td>
                  <td className="px-4 py-4 text-zinc-300">{row.itemsSold}</td>
                </tr>
              ))}

              {byStore.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    За выбранный период данных пока нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="mt-4 text-sm text-zinc-500">Загрузка отчета...</div>
        )}
      </div>
    </div>
  );
}