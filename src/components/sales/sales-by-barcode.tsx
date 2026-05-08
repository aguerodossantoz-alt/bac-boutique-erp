"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  image_url: string;
};

type CartItem = {
  productId: number;
  barcode: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  store: string;
  availableStock: number | null;
  image_url: string;
};

type RecentSale = {
  id: number;
  total: number;
  createdAt: string;
  itemsCount: number;
  lines: Array<{
    id: number;
    productId: number;
    barcode: string;
    name: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    store: string;
  }>;
};
type SalesByBarcodeProps = {
  role: "owner" | "admin" | "cashier";
  store: string;
};
const STORE_OPTIONS = ["Магазин 1", "Магазин 2"];
const STORAGE_KEY = "bac-boutique-catalog-import-v1";

function parseNumber(value: string): number {
  const text = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseNullableInt(value: string): number | null {
  const text = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!text) return null;

  const numeric = Number(text);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
}
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
function formatMoney(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function SalesByBarcode({ role, store }: SalesByBarcodeProps) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [sales, setSales] = useState<RecentSale[]>([]);
  const [currentStore, setCurrentStore] = useState(store || "Магазин 1");
  const [query, setQuery] = useState("");
  const [qtyInput, setQtyInput] = useState("1");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCancellingSaleId, setIsCancellingSaleId] = useState<number | null>(
    null
  
  );
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const boundStore = store ?? "";

const effectiveStore =
  role === "cashier" && boundStore ? boundStore : currentStore;

const allowedStores =
  role === "cashier" && boundStore ? [boundStore] : STORE_OPTIONS;
  async function loadProductsFromDbFirst() {
    try {
      const response = await fetch(
        `/api/products?store=${encodeURIComponent(effectiveStore)}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Не удалось прочитать Product.");
      }

      const rows = Array.isArray(result.rows) ? result.rows : [];
      setProducts(rows);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch (error) {
      console.error("База не ответила, беру localStorage:", error);

      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const fallbackRows = raw ? JSON.parse(raw) : [];
        setProducts(Array.isArray(fallbackRows) ? fallbackRows : []);
      } catch (localError) {
        console.error("Не удалось прочитать localStorage:", localError);
        setProducts([]);
      }
    }
  }

  async function loadSalesHistory() {
    try {
      const response = await fetch(
        `/api/sales?store=${encodeURIComponent(effectiveStore)}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Не удалось прочитать Sale.");
      }

      setSales(Array.isArray(result.rows) ? result.rows : []);
    } catch (error) {
      console.error("Не удалось загрузить историю продаж:", error);
      setSales([]);
    }
  }

  useEffect(() => {
  setCart([]);
  setQuery("");
  setQtyInput("1");
  setDiscountPercent("0");
  setMessage("");
  loadProductsFromDbFirst();
  loadSalesHistory();
}, [effectiveStore]);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);
  useEffect(() => {
  if (role === "cashier" && boundStore && currentStore !== boundStore) {
    setCurrentStore(boundStore);
  }
  }, [role, boundStore, currentStore]);
  const matchedProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return [];

    return products
      .filter((product) => {
        const barcode = product.barcode.toLowerCase();
        const name = product.name.toLowerCase();
        const article = product.article.toLowerCase();

        return (
          barcode.includes(search) ||
          name.includes(search) ||
          article.includes(search)
        );
      })
      .slice(0, 8);
  }, [products, query]);

  const selectedProduct = matchedProducts[0] ?? null;

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [cart]);
  const discountValue = useMemo(() => {
  const raw = parseNumber(discountPercent);
  if (raw < 0) return 0;
  if (raw > 100) return 100;
  return raw;
}, [discountPercent]);

const discountAmount = useMemo(() => {
  return roundMoney(cartTotal * (discountValue / 100));
}, [cartTotal, discountValue]);

const discountedCartTotal = useMemo(() => {
  return roundMoney(cartTotal - discountAmount);
}, [cartTotal, discountAmount]);

  function addToCart() {
    setMessage("");

    const search = query.trim().toLowerCase();
    if (!search) {
      setMessage("Введите штрихкод или название товара.");
      return;
    }

    const exactBarcodeProduct =
      products.find(
        (product) =>
          product.store === effectiveStore &&
          product.item_status === "READY_FOR_SALE" &&
          product.barcode.trim().toLowerCase() === search
      ) ?? selectedProduct;

    if (!exactBarcodeProduct) {
      setMessage("Товар не найден.");
      return;
    }

    if (exactBarcodeProduct.item_status !== "READY_FOR_SALE") {
      setMessage("Этот товар сейчас не готов к продаже.");
      return;
    }

    const qty = Math.max(1, Math.trunc(parseNumber(qtyInput) || 1));
    const availableStock = parseNullableInt(exactBarcodeProduct.stock_qty);

    const unitPrice =
      parseNumber(exactBarcodeProduct.promo_price) ||
      parseNumber(exactBarcodeProduct.retail_price);

    if (!unitPrice) {
      setMessage("У товара нет цены для продажи.");
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.productId === exactBarcodeProduct.id
      );

      if (existing) {
        const newQty = existing.qty + qty;

        if (availableStock !== null && newQty > availableStock) {
          setMessage("Недостаточно остатка.");
          return prev;
        }

        return prev.map((item) =>
          item.productId === exactBarcodeProduct.id
            ? {
                ...item,
                qty: newQty,
                lineTotal: newQty * item.unitPrice,
              }
            : item
        );
      }

      if (availableStock !== null && qty > availableStock) {
        setMessage("Недостаточно остатка.");
        return prev;
      }

      return [
        ...prev,
        {
          productId: exactBarcodeProduct.id,
          barcode: exactBarcodeProduct.barcode,
          name: exactBarcodeProduct.name,
          qty,
          unitPrice,
          lineTotal: qty * unitPrice,
          store: effectiveStore,
          availableStock,
          image_url: exactBarcodeProduct.image_url ?? "",
        },
      ];
    });

    setQuery("");
    setQtyInput("1");

    window.requestAnimationFrame(() => {
      barcodeInputRef.current?.focus();
    });
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));

    window.requestAnimationFrame(() => {
      barcodeInputRef.current?.focus();
    });
  }

  function changeCartQty(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;

          const nextQty = item.qty + delta;

          if (nextQty <= 0) {
            return null;
          }

          if (item.availableStock !== null && nextQty > item.availableStock) {
            setMessage("Недостаточно остатка.");
            return item;
          }

          return {
            ...item,
            qty: nextQty,
            lineTotal: nextQty * item.unitPrice,
          };
        })
        .filter(Boolean) as CartItem[]
    );

    window.requestAnimationFrame(() => {
      barcodeInputRef.current?.focus();
    });
  }

  function changeCartPrice(productId: number, rawValue: string) {
    const nextPrice = parseNumber(rawValue);

    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        return {
          ...item,
          unitPrice: nextPrice,
          lineTotal: nextPrice * item.qty,
        };
      })
    );
  }

  function clearCart() {
    setCart([]);
    setMessage("");
    setDiscountPercent("0");

    window.requestAnimationFrame(() => {
      barcodeInputRef.current?.focus();
    });
  }

  async function completeSale() {
    if (cart.length === 0) {
      setMessage("Чек пустой.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  items: cart.map((item) => {
    const factor = 1 - discountValue / 100;

    return {
      productId: item.productId,
      barcode: item.barcode,
      qty: item.qty,
      unitPrice: roundMoney(item.unitPrice * factor),
      store: item.store,
    };
  }),
}),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Не удалось завершить продажу.");
      }

      setCart([]);
      setQuery("");
      setQtyInput("1");
      setDiscountPercent("0");
      setMessage(`Продажа #${result.sale.id} сохранена.`);

      window.requestAnimationFrame(() => {
        barcodeInputRef.current?.focus();
      });

      await loadProductsFromDbFirst();
      await loadSalesHistory();
    } catch (error) {
      console.error("Ошибка завершения продажи:", error);
      setMessage(
        error instanceof Error ? error.message : "Ошибка завершения продажи."
      );
    } finally {
      setIsSaving(false);
    }
  }
  function toggleSale(saleId: number) {
  setExpandedSaleId((prev) => (prev === saleId ? null : saleId));
}
  async function cancelSale(saleId: number) {
    const confirmed = window.confirm(
      `Отменить продажу #${saleId}? Остатки вернутся обратно.`
    );
    if (!confirmed) return;

    try {
      setIsCancellingSaleId(saleId);
      setMessage("");

      const response = await fetch(`/api/sales/${saleId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Не удалось отменить продажу.");
      }

      setMessage(`Продажа #${saleId} отменена.`);
      await loadProductsFromDbFirst();
      await loadSalesHistory();

      window.requestAnimationFrame(() => {
        barcodeInputRef.current?.focus();
      });
    } catch (error) {
      console.error("Ошибка отмены продажи:", error);
      setMessage(
        error instanceof Error ? error.message : "Ошибка отмены продажи."
      );
    } finally {
      setIsCancellingSaleId(null);
    }
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 overflow-x-hidden">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Продажи / Касса
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Продажа по штрихкоду
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
              Продажа создает запись в Sale, строки чека в SaleItem и уменьшает
              stockQty у товара в Product.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {role === "cashier" ? (
  <div className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-sm text-white">
    {effectiveStore || "Магазин не назначен"}
  </div>
) : (
  <select
    value={currentStore}
    onChange={(event) => setCurrentStore(event.target.value)}
    className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-sm text-white outline-none"
  >
    {allowedStores.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
)}

            <button
              type="button"
              onClick={clearCart}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              Очистить чек
            </button>

            <button
              type="button"
              onClick={completeSale}
              disabled={cart.length === 0 || isSaving}
              className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSaving ? "Сохранение..." : "Завершить продажу"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="text-sm text-zinc-500">Товаров в базе</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {products.length}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="text-sm text-zinc-500">Позиций в чеке</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {cart.length}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="text-sm text-zinc-500">Сумма чека</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {formatMoney(discountedCartTotal)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="text-sm text-zinc-500">Последних продаж</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {sales.length}
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Добавить в чек
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Поиск по штрихкоду / названию / артикулу
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_120px_160px_200px]">
            <input
              ref={barcodeInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addToCart();
                }
              }}
              placeholder="Введите штрихкод или начните сканирование"
              className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-white outline-none placeholder:text-zinc-500"
            />

            <input
              value={qtyInput}
              onChange={(event) => setQtyInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addToCart();
                }
              }}
              placeholder="Кол-во"
              className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-white outline-none placeholder:text-zinc-500"
            />
             <input
             value={discountPercent}
             onChange={(event) => setDiscountPercent(event.target.value)}
             placeholder="Скидка %"
             className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-white outline-none placeholder:text-zinc-500"
/>
            <button
              type="button"
              onClick={addToCart}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              Добавить в чек
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#090909] p-4">
            {selectedProduct ? (
              <div className="space-y-2">
                <div className="text-sm text-zinc-500">
                  Первый найденный товар
                </div>
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
                  Остаток: {selectedProduct.stock_qty || "не заполнен"}
                </div>
                <div className="text-sm text-zinc-300">
                  Цена продажи:{" "}
                  {formatMoney(
                    parseNumber(selectedProduct.promo_price) ||
                      parseNumber(selectedProduct.retail_price)
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-zinc-500">
                Введите штрихкод, название или артикул — здесь появится товар.
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

        <div className="w-full max-w-full min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-6 2xl:max-w-[520px]">
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Текущий чек
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Товары в продаже
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
  <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
    <div className="text-xs text-zinc-500">До скидки</div>
    <div className="mt-2 text-lg font-semibold text-white">
      {formatMoney(cartTotal)}
    </div>
  </div>

  <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
    <div className="text-xs text-zinc-500">Скидка</div>
    <div className="mt-2 text-lg font-semibold text-emerald-300">
      {discountValue}%
    </div>
    <div className="mt-1 text-sm text-zinc-500">
      - {formatMoney(discountAmount)}
    </div>
  </div>

  <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
    <div className="text-xs text-zinc-500">Итого</div>
    <div className="mt-2 text-lg font-semibold text-white">
      {formatMoney(discountedCartTotal)}
    </div>
  </div>
</div>
          <div className="mt-5 max-w-full overflow-x-auto border border-white/10">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-white/[0.04] text-zinc-400">
                <tr>
                  <th className="px-4 py-4 font-medium">Товар</th>
                  <th className="px-4 py-4 font-medium">Штрихкод</th>
                  <th className="px-4 py-4 font-medium">Цена</th>
                  <th className="px-4 py-4 font-medium">Кол-во</th>
                  <th className="px-4 py-4 font-medium">Сумма</th>
                  <th className="px-4 py-4 font-medium">Действие</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr
                    key={item.productId}
                    className="border-t border-white/10 bg-[#090909]"
                  >
                    <td className="min-w-0 max-w-[220px] break-words whitespace-normal px-4 py-4 text-white">{item.name}</td>
                    <td className="min-w-0 break-words whitespace-normal px-4 py-4 text-zinc-300">
                      {item.barcode}
                    </td>
                    <td className="px-4 py-4">
                      <input
                        value={String(item.unitPrice)}
                        onChange={(event) =>
                          changeCartPrice(item.productId, event.target.value)
                        }
                        className="w-20 min-w-0 rounded-xl border border-white/10 bg-[#050505] px-3 py-2 text-zinc-300 outline-none"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changeCartQty(item.productId, -1)}
                          className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08]"
                        >
                          -
                        </button>

                        <div className="min-w-[32px] text-center text-zinc-300">
                          {item.qty}
                        </div>

                        <button
                          type="button"
                          onClick={() => changeCartQty(item.productId, 1)}
                          className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08]"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-zinc-300">
                      {formatMoney(item.lineTotal)}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/20"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}

                {cart.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-zinc-500"
                    >
                      Чек пока пуст.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          История
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Последние продажи
        </h2>

        <div className="mt-5 space-y-3">
          {sales.map((sale) => (
  <div
    key={sale.id}
    onClick={() => toggleSale(sale.id)}
    className="cursor-pointer rounded-2xl border border-white/10 bg-[#090909] p-4 transition hover:bg-white/[0.03]"
  >
            
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    {expandedSaleId === sale.id && (
  <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
    <table className="min-w-full border-collapse text-left text-sm">
      <thead className="bg-white/[0.04] text-zinc-400">
        <tr>
          <th className="px-4 py-3 font-medium">Товар</th>
          <th className="px-4 py-3 font-medium">Штрихкод</th>
          <th className="px-4 py-3 font-medium">Цена</th>
          <th className="px-4 py-3 font-medium">Кол-во</th>
          <th className="px-4 py-3 font-medium">Сумма</th>
        </tr>
      </thead>
      <tbody>
        {sale.lines.map((line) => (
          <tr
            key={line.id}
            className="border-t border-white/10 bg-[#050505]"
          >
            <td className="px-4 py-3 text-white">{line.name}</td>
            <td className="px-4 py-3 text-zinc-300">{line.barcode}</td>
            <td className="px-4 py-3 text-zinc-300">
              {formatMoney(line.unitPrice)}
            </td>
            <td className="px-4 py-3 text-zinc-300">{line.qty}</td>
            <td className="px-4 py-3 text-zinc-300">
              {formatMoney(line.lineTotal)}
            </td>
          </tr>
        ))}

        {sale.lines.length === 0 && (
          <tr>
            <td
              colSpan={5}
              className="px-4 py-6 text-center text-sm text-zinc-500"
            >
              В этой продаже нет строк.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)}
                  <div className="text-sm text-zinc-500">
                    {formatDate(sale.createdAt)}
                  </div>
                  <div className="mt-1 text-lg font-medium text-white">
                    Продажа #{sale.id}
                  </div>
                  <div className="mt-1 text-sm text-zinc-300">
                  Позиций: {sale.itemsCount}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                {expandedSaleId === sale.id ? "Нажми, чтобы скрыть состав" : "Нажми, чтобы открыть состав"}
                 </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xl font-semibold text-white">
                    {formatMoney(sale.total)}
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                    event.stopPropagation();
                    cancelSale(sale.id);
                    }}
                    disabled={isCancellingSaleId === sale.id}
                    className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isCancellingSaleId === sale.id ? "Отмена..." : "Отменить"}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {sales.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#090909] p-4 text-sm text-zinc-500">
              Продаж пока нет.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}