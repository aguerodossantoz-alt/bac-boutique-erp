"use client";

import { useEffect, useMemo, useState } from "react";

type ExpenseRow = {
  id: number;
  title: string;
  amount: number;
  category: string;
  store: string;
  date: string;
  comment: string;
};

type ExpensesResponse = {
  ok: boolean;
  summary: {
    totalAmount: number;
    count: number;
    storesCount: number;
    month: string;
  };
  rows: ExpenseRow[];
};

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function todayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

const STORE_OPTIONS = ["Магазин 1", "Магазин 2"];
const CATEGORY_OPTIONS = [
  "Аренда",
  "Зарплата",
  "Доставка",
  "Логистика",
  "Хозрасходы",
  "Реклама",
  "Прочее",
];

export function ExpensesManager() {
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [count, setCount] = useState(0);
  const [storesCount, setStoresCount] = useState(0);
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Прочее");
  const [store, setStore] = useState("Магазин 1");
  const [date, setDate] = useState(todayDate());
  const [comment, setComment] = useState("");

  async function loadExpenses() {
    try {
      const response = await fetch(`/api/expenses?month=${month}`, {
        cache: "no-store",
      });

      const result = (await response.json()) as ExpensesResponse | { error?: string };

      if (!response.ok) {
        throw new Error("error" in result ? result.error || "Ошибка загрузки расходов." : "Ошибка загрузки расходов.");
      }

      if (!("summary" in result)) return;

      setRows(Array.isArray(result.rows) ? result.rows : []);
      setTotalAmount(result.summary.totalAmount || 0);
      setCount(result.summary.count || 0);
      setStoresCount(result.summary.storesCount || 0);
    } catch (error) {
      console.error("Ошибка загрузки расходов:", error);
      setMessage(error instanceof Error ? error.message : "Ошибка загрузки расходов.");
      setRows([]);
      setTotalAmount(0);
      setCount(0);
      setStoresCount(0);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, [month]);

  async function saveExpense() {
    try {
      setMessage("");

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          amount,
          category,
          store,
          date,
          comment,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Не удалось сохранить расход.");
      }

      setTitle("");
      setAmount("");
      setCategory("Прочее");
      setStore("Магазин 1");
      setDate(todayDate());
      setComment("");
      setMessage("Расход сохранен.");

      await loadExpenses();
    } catch (error) {
      console.error("Ошибка сохранения расхода:", error);
      setMessage(error instanceof Error ? error.message : "Ошибка сохранения расхода.");
    }
  }

  async function deleteExpense(id: number) {
    try {
      setMessage("");

      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Не удалось удалить расход.");
      }

      setMessage("Расход удален.");
      await loadExpenses();
    } catch (error) {
      console.error("Ошибка удаления расхода:", error);
      setMessage(error instanceof Error ? error.message : "Ошибка удаления расхода.");
    }
  }

  const groupedByStore = useMemo(() => {
    const map = new Map<string, number>();

    for (const row of rows) {
      const key = row.store || "Без магазина";
      map.set(key, (map.get(key) || 0) + row.amount);
    }

    return Array.from(map.entries()).map(([storeName, amount]) => ({
      storeName,
      amount,
    }));
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Расходы / Учет
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Расходы бутика
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
              Здесь добавляются аренда, зарплата, логистика, хозрасходы и прочие
              траты. Данные сохраняются в SQLite и попадают в финансовую сводку.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-zinc-300">
              Фильтр месяца:
            </div>
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="text-sm text-zinc-500">Всего расходов за месяц</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {formatMoney(totalAmount)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="text-sm text-zinc-500">Записей</div>
            <div className="mt-2 text-2xl font-semibold text-white">{count}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="text-sm text-zinc-500">Магазинов с расходами</div>
            <div className="mt-2 text-2xl font-semibold text-white">{storesCount}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="text-sm text-zinc-500">Последний месяц</div>
            <div className="mt-2 text-2xl font-semibold text-white">{month}</div>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {message}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Новый расход
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Добавить запись
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <div className="mb-2 text-sm text-zinc-400">Название</div>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Например: аренда, зарплата, доставка"
                className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-white outline-none placeholder:text-zinc-500"
              />
            </div>

            <div>
              <div className="mb-2 text-sm text-zinc-400">Сумма</div>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Например: 25000"
                className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-white outline-none placeholder:text-zinc-500"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm text-zinc-400">Категория</div>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-white outline-none"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-2 text-sm text-zinc-400">Магазин</div>
                <select
                  value={store}
                  onChange={(event) => setStore(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-white outline-none"
                >
                  {STORE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm text-zinc-400">Дата</div>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-white outline-none"
              />
            </div>

            <div>
              <div className="mb-2 text-sm text-zinc-400">Комментарий</div>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Необязательно"
                className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-white outline-none placeholder:text-zinc-500"
              />
            </div>

            <button
              type="button"
              onClick={saveExpense}
              className="w-full rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
            >
              Сохранить расход
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              По магазинам
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Сводка расходов
            </h2>

            <div className="mt-5 space-y-3">
              {groupedByStore.map((item) => (
                <div
                  key={item.storeName}
                  className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-sm text-zinc-300"
                >
                  <div className="flex items-center justify-between">
                    <span>{item.storeName}</span>
                    <span className="font-medium text-white">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                </div>
              ))}

              {groupedByStore.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-sm text-zinc-500">
                  За выбранный месяц расходов пока нет.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Последние записи
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              История расходов
            </h2>

            <div className="mt-5 space-y-3">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-white/10 bg-[#090909] p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-lg font-medium text-white">
                        {row.title}
                      </div>
                      <div className="mt-1 text-sm text-zinc-400">
                        {row.category} · {row.store || "Без магазина"} · {row.date}
                      </div>
                      {row.comment && (
                        <div className="mt-2 text-sm text-zinc-300">
                          {row.comment}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-white">
                        {formatMoney(row.amount)}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteExpense(row.id)}
                        className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/20"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {rows.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-sm text-zinc-500">
                  Записей пока нет.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}