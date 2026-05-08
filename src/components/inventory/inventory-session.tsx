"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type ProductRow = {
  id: number;
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

type InventoryLine = {
  productId: number;
  barcode: string;
  name: string;
  article: string;
  store: string;
  beforeQty: number | null;
  factQty: number;
  difference: number | null;
};

const INVENTORY_SESSION_KEY = "bac-boutique-inventory-session-v1";
const STORE_OPTIONS = ["Магазин 1", "Магазин 2"];

function parseNullableInt(value: string): number | null {
  const text = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!text) return null;

  const numeric = Number(text);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
}

function formatDiff(value: number | null) {
  if (value === null) return "—";
  if (value > 0) return `+${value}`;
  return String(value);
}

export function InventorySession() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [query, setQuery] = useState("");
  const [factQty, setFactQty] = useState("0");
  const [sessionLines, setSessionLines] = useState<InventoryLine[]>([]);
  const [message, setMessage] = useState("");
  const [currentStore, setCurrentStore] = useState("Магазин 1");
  const [isFinishing, setIsFinishing] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const storageKey = `${INVENTORY_SESSION_KEY}-${currentStore}`;

async function loadProducts() {
  try {
    const response = await fetch(
      `/api/products?store=${encodeURIComponent(currentStore)}`,
      {
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error || "Не удалось прочитать Product.");
    }

    setProducts(Array.isArray(result.rows) ? result.rows : []);
  } catch (error) {
    console.error("Ошибка загрузки Product:", error);
    setMessage(
      error instanceof Error ? error.message : "Ошибка загрузки Product."
    );
  }
}

useEffect(() => {
  setQuery("");
  setFactQty("0");
  setMessage("");
  loadProducts();
}, [currentStore]);

useEffect(() => {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    setSessionLines(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.error("Не удалось прочитать сессию инвентаризации:", error);
    setSessionLines([]);
  }
}, [storageKey]);



  const matchedProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return [];

    const exactBarcode = products.find(
      (product) => product.barcode.trim().toLowerCase() === search
    );
    if (exactBarcode) return [exactBarcode];

    return products
      .filter((product) => {
        return (
          product.barcode.toLowerCase().includes(search) ||
          product.name.toLowerCase().includes(search) ||
          product.article.toLowerCase().includes(search)
        );
      })
      .slice(0, 8);
  }, [products, query]);

  const selectedProduct = matchedProducts[0] ?? null;

  const summary = useMemo(() => {
    let totalFact = 0;
    let shortages = 0;
    let surpluses = 0;
    let unchanged = 0;

    for (const line of sessionLines) {
      totalFact += line.factQty;

      if (line.difference === null) continue;
      if (line.difference < 0) shortages += 1;
      else if (line.difference > 0) surpluses += 1;
      else unchanged += 1;
    }

    return {
      countedLines: sessionLines.length,
      totalFact,
      shortages,
      surpluses,
      unchanged,
    };
  }, [sessionLines]);

  function onSearchEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      scanProduct();
    }
  }

  function scanProduct() {
    setMessage("");

    if (!selectedProduct) {
      setMessage("Товар не найден.");
      return;
    }

    addProductToSession(selectedProduct);
  }

  function addProductToSession(product: ProductRow) {
    const parsedFactQty = parseNullableInt(factQty);

    if (parsedFactQty !== null && parsedFactQty < 0) {
      setMessage("Введите корректный факт.");
      return;
    }

    const qtyToAdd = parsedFactQty === null || parsedFactQty === 0 ? 1 : parsedFactQty;
    const beforeQty = parseNullableInt(product.stock_qty);
    let savedFactQty = qtyToAdd;

    setSessionLines((prev) => {
      const existingLine = prev.find(
        (line) => line.productId === product.id || line.barcode === product.barcode
      );

      const nextFactQty = existingLine ? existingLine.factQty + qtyToAdd : qtyToAdd;
      savedFactQty = nextFactQty;
      const difference = beforeQty === null ? null : nextFactQty - beforeQty;

      const nextLine: InventoryLine = {
        productId: product.id,
        barcode: product.barcode,
        name: product.name,
        article: product.article,
        store: product.store,
        beforeQty,
        factQty: nextFactQty,
        difference,
      };

      const next = existingLine
        ? prev.map((line) =>
            line.productId === nextLine.productId ? nextLine : line
          )
        : [nextLine, ...prev];

      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });

    setMessage(`Сохранено в сессии: ${product.name}. Факт: ${savedFactQty}`);
    setQuery("");
    setFactQty("0");
    requestAnimationFrame(() => {
      barcodeInputRef.current?.focus();
    });
  }

  function saveLine() {
    setMessage("");

    if (!selectedProduct) {
      setMessage("Сначала найди товар.");
      return;
    }

    addProductToSession(selectedProduct);
  }

  function removeLine(productId: number) {
    setSessionLines((prev) => {
      const next = prev.filter((line) => line.productId !== productId);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  async function finishInventory() {
    if (sessionLines.length === 0) {
      setMessage("Сессия инвентаризации пустая.");
      return;
    }

    try {
      setIsFinishing(true);
      setMessage("");

      const response = await fetch("/api/inventory/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: sessionLines.map((line) => ({
            productId: line.productId,
            factQty: line.factQty,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Не удалось завершить инвентаризацию.");
      }

      localStorage.removeItem(storageKey);
      setSessionLines([]);
      setQuery("");
      setFactQty("0");
      setMessage(
        `Инвентаризация завершена. Обновлено товаров: ${result.updatedCount}.`
      );

      await loadProducts();
    } catch (error) {
      console.error("Ошибка завершения инвентаризации:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Ошибка завершения инвентаризации."
      );
    } finally {
      setIsFinishing(false);
    }
  }

 return (
  <div className="space-y-6">
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Инвентаризация / Product.stockQty
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Инвентаризация магазина
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
            Сканируешь товар, вводишь фактическое количество, сохраняешь в
            текущую сессию и в конце завершаешь инвентаризацию.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={currentStore}
            onChange={(event) => setCurrentStore(event.target.value)}
            className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-sm text-white outline-none"
          >
            {STORE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={finishInventory}
            disabled={sessionLines.length === 0 || isFinishing}
            className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isFinishing ? "Завершение..." : "Завершить инвентаризацию"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
          <div className="text-sm text-zinc-500">Позиций в сессии</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {summary.countedLines}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
          <div className="text-sm text-zinc-500">Найдено штук</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {summary.totalFact}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
          <div className="text-sm text-zinc-500">Недостача</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {summary.shortages}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
          <div className="text-sm text-zinc-500">Излишек</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {summary.surpluses}
          </div>
        </div>
      </div>

      {message && (
        <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {message}
        </div>
      )}
    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Сканирование
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Найти товар
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_180px_160px]">
          <input
            ref={barcodeInputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onSearchEnter}
            placeholder="Сканируй штрихкод или ищи по артикулу / названию"
            className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-white outline-none placeholder:text-zinc-500"
          />

          <input
            value={factQty}
            onChange={(event) => setFactQty(event.target.value)}
            placeholder="Факт"
            className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-white outline-none placeholder:text-zinc-500"
          />

          <button
            type="button"
            onClick={scanProduct}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-medium text-white transition hover:bg-white/[0.08]"
          >
            Сканировать
          </button>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={saveLine}
            className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
          >
            Сохранить
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-[#090909] p-4">
          {selectedProduct ? (
            <div className="space-y-2">
              <div className="text-lg font-medium text-white">
                {selectedProduct.name}
              </div>
              <div className="text-sm text-zinc-300">
                Штрихкод: {selectedProduct.barcode}
              </div>
              <div className="text-sm text-zinc-300">
                Артикул: {selectedProduct.article || "—"}
              </div>
              <div className="text-sm text-zinc-300">
                Магазин: {selectedProduct.store || "—"}
              </div>
              <div className="text-sm text-zinc-300">
                Остаток в базе: {selectedProduct.stock_qty || "не заполнен"}
              </div>
              <div className="text-sm text-zinc-300">
                Статус: {selectedProduct.item_status}
              </div>
            </div>
          ) : (
            <div className="text-sm text-zinc-500">
              Здесь появится найденный товар.
            </div>
          )}
        </div>

        {matchedProducts.length > 1 && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="mb-3 text-sm text-zinc-500">Еще совпадения</div>
            <div className="space-y-2">
              {matchedProducts.slice(1).map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setQuery(product.barcode)}
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-white/[0.06]"
                >
                  {product.name} — {product.barcode}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Текущая сессия
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Сохраненные позиции
        </h2>

        <div className="mt-5 overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-white/[0.04] text-zinc-400">
              <tr>
                <th className="px-4 py-4 font-medium">Товар</th>
                <th className="px-4 py-4 font-medium">До</th>
                <th className="px-4 py-4 font-medium">Факт</th>
                <th className="px-4 py-4 font-medium">Разница</th>
                <th className="px-4 py-4 font-medium">Действие</th>
              </tr>
            </thead>
            <tbody>
              {sessionLines.map((line) => (
                <tr
                  key={line.productId}
                  className="border-t border-white/10 bg-[#090909]"
                >
                  <td className="px-4 py-4 text-white">
                    <div>{line.name}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {line.barcode}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-zinc-300">
                    {line.beforeQty === null ? "—" : line.beforeQty}
                  </td>
                  <td className="px-4 py-4 text-zinc-300">{line.factQty}</td>
                  <td className="px-4 py-4 text-zinc-300">
                    {formatDiff(line.difference)}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => removeLine(line.productId)}
                      className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/20"
                    >
                      Убрать
                    </button>
                  </td>
                </tr>
              ))}

              {sessionLines.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    Сессия инвентаризации пока пустая.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
}
