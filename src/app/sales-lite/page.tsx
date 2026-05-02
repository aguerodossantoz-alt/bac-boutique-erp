"use client";

import { useEffect, useMemo, useState } from "react";

type RawProduct = Record<string, unknown>;

type Product = {
  id: string | number;
  name: string;
  article: string;
  barcode: string;
  store: string;
  stockQty: number | null;
  price: number;
};

type ReceiptItem = {
  productId: string | number;
  name: string;
  article: string;
  barcode: string;
  store: string;
  price: number;
  qty: number;
  stockQty: number | null;
};

type SessionUser = {
  name?: string | null;
  username?: string | null;
  role?: string | null;
  store?: string | null;
};

function isRecord(value: unknown): value is RawProduct {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readField(obj: RawProduct, keys: string[]): unknown {
  const entries = Object.entries(obj);

  for (const targetKey of keys) {
    if (obj[targetKey] !== undefined && obj[targetKey] !== null) {
      return obj[targetKey];
    }

    const found = entries.find(
      ([key]) => key.toLowerCase() === targetKey.toLowerCase()
    );

    if (found && found[1] !== undefined && found[1] !== null) {
      return found[1];
    }
  }

  return null;
}

function readString(obj: RawProduct, keys: string[]): string {
  const value = readField(obj, keys);

  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);

  if (isRecord(value)) {
    const nested = readField(value, ["value", "code", "name", "title"]);

    if (typeof nested === "string") return nested.trim();
    if (typeof nested === "number") return String(nested);
  }

  return "";
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const cleaned = value
      .replace(/\s/g, "")
      .replace(/[^\d,.-]/g, "")
      .replace(",", ".");

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function extractProductRecords(data: unknown, depth = 0): RawProduct[] {
  if (depth > 4) return [];

  if (Array.isArray(data)) return data.filter(isRecord);
  if (!isRecord(data)) return [];

  const arrayKeys = [
    "products",
    "items",
    "data",
    "result",
    "rows",
    "records",
    "list",
  ];

  for (const key of arrayKeys) {
    const records = extractProductRecords(data[key], depth + 1);
    if (records.length > 0) return records;
  }

  const looksLikeProduct =
    data.id !== undefined ||
    data.productId !== undefined ||
    data.name !== undefined ||
    data.title !== undefined ||
    data.article !== undefined ||
    data.barcode !== undefined;

  return looksLikeProduct ? [data] : [];
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(value: string): string {
  return normalizeText(value).replace(/[^a-zа-я0-9]/gi, "");
}

function sameStore(productStore: string, currentStore: string): boolean {
  if (!productStore) return false;
  return normalizeText(productStore) === normalizeText(currentStore);
}

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(value || 0))} ₽`;
}

function buildProduct(raw: RawProduct): Product {
  const name =
    readString(raw, [
      "name",
      "title",
      "productName",
      "cleanName",
      "fullName",
      "nomenclature",
      "номенклатура",
      "Наименование",
    ]) || "Без названия";

  const article = readString(raw, [
    "article",
    "sku",
    "vendorCode",
    "model",
    "артикул",
    "Артикул",
  ]);

  const barcode = readString(raw, [
    "barcode",
    "barCode",
    "barcodeValue",
    "штрихкод",
    "Штрихкод",
  ]);

  const store = readString(raw, [
    "store",
    "storeName",
    "shop",
    "location",
    "магазин",
    "Магазин",
  ]);

  const rawId = readField(raw, ["id", "productId", "uuid", "code"]);

  const id =
    typeof rawId === "number" || typeof rawId === "string"
      ? rawId
      : article || barcode || name;

  const stockQty =
    parseNumber(
      readField(raw, [
        "stockQty",
        "stock",
        "quantity",
        "qty",
        "balance",
        "остаток",
        "Остаток",
      ])
    ) ?? null;

  const price =
    parseNumber(
      readField(raw, [
        "promoPrice",
        "promo_price",
        "акционнаяЦена",
        "АкционнаяЦена",
        "акционная цена",
        "Акционная цена",
        "retailPrice",
        "retail_price",
        "розничнаяЦена",
        "РозничнаяЦена",
        "розничная цена",
        "Розничная цена",
        "salePrice",
        "sale_price",
        "currentPrice",
        "current_price",
        "newPrice",
        "new_price",
        "price",
        "цена",
        "Цена",
      ])
    ) ?? 0;

  return {
    id,
    name,
    article,
    barcode,
    store,
    stockQty,
    price,
  };
}

function getProductsFromResponse(data: unknown): Product[] {
  return extractProductRecords(data).map(buildProduct);
}

function isExactProductMatch(product: Product, query: string): boolean {
  const q = compactText(query);

  if (!q) return false;

  const article = compactText(product.article);
  const barcode = compactText(product.barcode);

  if (article && q === article) return true;
  if (barcode && q === barcode) return true;

  return false;
}

async function loadProducts(query: string, store: string): Promise<Product[]> {
  const encodedQuery = encodeURIComponent(query);
  const encodedStore = encodeURIComponent(store);

  const urls = [
    `/api/products?search=${encodedQuery}&store=${encodedStore}`,
    `/api/products?q=${encodedQuery}&store=${encodedStore}`,
    `/api/products?query=${encodedQuery}&store=${encodedStore}`,
    `/api/products?store=${encodedStore}`,
    "/api/products",
  ];

  const map = new Map<string, Product>();

  for (const url of urls) {
    try {
      const response = await fetch(url);

      if (!response.ok) continue;

      const data = await response.json();
      const products = getProductsFromResponse(data);

      for (const product of products) {
        if (!sameStore(product.store, store)) continue;

        const key = String(
          product.id || product.barcode || product.article || product.name
        );

        if (!map.has(key)) {
          map.set(key, product);
        }
      }
    } catch (error) {
      console.error("Products API error:", url, error);
    }
  }

  return Array.from(map.values());
}

function getSessionUser(data: unknown): SessionUser | null {
  if (!isRecord(data)) return null;

  const user = data.user;

  if (!isRecord(user)) return null;

  return {
    name:
      typeof user.name === "string"
        ? user.name
        : typeof user.displayName === "string"
          ? user.displayName
          : null,
    username: typeof user.username === "string" ? user.username : null,
    role: typeof user.role === "string" ? user.role : null,
    store: typeof user.store === "string" ? user.store : null,
  };
}

export default function SalesLitePage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState("0");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selling, setSelling] = useState(false);

  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [selectedStore, setSelectedStore] = useState("Магазин 1");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        const nextUser = getSessionUser(data);

        if (!mounted) return;

        setUser(nextUser);

        if (
          nextUser?.store &&
          nextUser.store !== "all" &&
          nextUser.store !== "Все магазины"
        ) {
          setSelectedStore(nextUser.store);
        }
      } catch (error) {
        console.error("Session error:", error);

        if (mounted) {
          setMessage("Не удалось определить пользователя.");
        }
      } finally {
        if (mounted) {
          setSessionLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const canSelectStore =
    user?.role === "owner" ||
    user?.role === "admin" ||
    user?.store === "all" ||
    user?.store === "Все магазины" ||
    !user?.store;

  const currentStore =
    !canSelectStore && user?.store ? user.store : selectedStore;

  const discount = Math.min(
    100,
    Math.max(0, parseNumber(discountPercent) ?? 0)
  );

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    return Math.round((subtotal * discount) / 100);
  }, [subtotal, discount]);

  const total = Math.max(0, subtotal - discountAmount);

  async function addItem() {
    const cleanQuery = query.trim();

    if (!currentStore) {
      setMessage("Сначала выберите магазин.");
      return;
    }

    if (!cleanQuery) {
      setMessage("Введите точный штрихкод или артикул.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const products = await loadProducts(cleanQuery, currentStore);

      if (!products.length) {
        setMessage("В выбранном магазине нет товаров.");
        return;
      }

      const product = products.find((item) =>
        isExactProductMatch(item, cleanQuery)
      );

      if (!product) {
        setMessage(
          `Товар не найден в ${currentStore}. Введите точный артикул или штрихкод.`
        );
        return;
      }

      if (product.stockQty !== null && product.stockQty <= 0) {
        setMessage("Товар найден, но остаток 0. Продажу лучше не проводить.");
        return;
      }

      setItems((prev) => {
        const existing = prev.find((item) => item.productId === product.id);

        if (existing) {
          return prev.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  qty: item.qty + 1,
                }
              : item
          );
        }

        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            article: product.article,
            barcode: product.barcode,
            store: currentStore,
            price: product.price,
            qty: 1,
            stockQty: product.stockQty,
          },
        ];
      });

      setQuery("");
      setMessage(`Добавлено: ${product.name}`);
    } catch (error) {
      console.error(error);
      setMessage("Ошибка при поиске товара.");
    } finally {
      setLoading(false);
    }
  }

  function decreaseItem(productId: string | number) {
    setItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                qty: item.qty - 1,
              }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  }

  function increaseItem(productId: string | number) {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              qty: item.qty + 1,
            }
          : item
      )
    );
  }

  function changePrice(productId: string | number, value: string) {
    const nextPrice = parseNumber(value) ?? 0;

    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              price: nextPrice,
            }
          : item
      )
    );
  }

  async function sell() {
    if (!currentStore) {
      setMessage("Не выбран магазин. Продажа запрещена.");
      return;
    }

    if (!items.length) {
      setMessage("Чек пустой.");
      return;
    }

    const hasWrongStore = items.some(
      (item) => normalizeText(item.store) !== normalizeText(currentStore)
    );

    if (hasWrongStore) {
      setMessage("В чеке есть товар из другого магазина. Очистите чек.");
      return;
    }

    setSelling(true);
    setMessage("");

    const saleLines = items.map((item) => {
      const discountedUnitPrice = Math.round(item.price * (1 - discount / 100));

      return {
        productId: item.productId,
        qty: item.qty,
        quantity: item.qty,
        price: discountedUnitPrice,
        salePrice: discountedUnitPrice,
        retailPrice: discountedUnitPrice,
        originalPrice: item.price,
        discountPercent: discount,
        lineTotal: discountedUnitPrice * item.qty,
        total: discountedUnitPrice * item.qty,
        store: currentStore,
      };
    });

    const payloads: Record<string, unknown>[] = [
      {
        items: saleLines,
        total,
        subtotal,
        discountPercent: discount,
        discountAmount,
        totalAmount: total,
        store: currentStore,
        cashier: user?.username || user?.name || "cashier",
      },
      {
        saleItems: saleLines,
        total,
        subtotal,
        discountPercent: discount,
        discountAmount,
        totalAmount: total,
        store: currentStore,
        cashier: user?.username || user?.name || "cashier",
      },
      {
        products: saleLines,
        total,
        subtotal,
        discountPercent: discount,
        discountAmount,
        totalAmount: total,
        store: currentStore,
        cashier: user?.username || user?.name || "cashier",
      },
    ];

    let lastError = "";

    try {
      for (const payload of payloads) {
        const response = await fetch("/api/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          setItems([]);
          setDiscountPercent("0");
          setMessage(`Продажа сохранена в магазин: ${currentStore}`);
          return;
        }

        lastError = await response.text();
      }

      console.error("Sale API error:", lastError);
      setMessage("Продажа не прошла. Нужно проверить формат POST /api/sales.");
    } catch (error) {
      console.error(error);
      setMessage("Ошибка при сохранении продажи.");
    } finally {
      setSelling(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 pb-56 pt-5 text-white">
      <div className="mx-auto max-w-md">
        <section className="mb-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs uppercase tracking-[0.35em] text-zinc-500">
            BAC ERP
          </div>

          <h1 className="mt-3 text-3xl font-semibold leading-tight">
            Аварийная касса
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Введите точный артикул или штрихкод. Продажа будет записана в
            выбранный магазин.
          </p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">
              Пользователь
            </div>

            <div className="mt-2 text-sm text-white">
              {sessionLoading
                ? "Определяем..."
                : user?.username || user?.name || "Неизвестный пользователь"}
            </div>

            <div className="mt-3 text-xs uppercase tracking-[0.25em] text-zinc-500">
              Магазин продажи
            </div>

            {canSelectStore ? (
              <select
                value={selectedStore}
                onChange={(event) => {
                  setSelectedStore(event.target.value);
                  setItems([]);
                  setMessage("Магазин изменён. Чек очищен.");
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-white outline-none"
              >
                <option value="Магазин 1">Магазин 1</option>
                <option value="Магазин 2">Магазин 2</option>
              </select>
            ) : (
              <div className="mt-2 rounded-xl border border-white/10 bg-black px-3 py-3 text-white">
                {currentStore}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <label className="text-xs uppercase tracking-[0.25em] text-zinc-500">
            Штрихкод / артикул
          </label>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addItem();
              }
            }}
            placeholder="Введите точный артикул или штрихкод"
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-base text-white outline-none placeholder:text-zinc-600"
            autoFocus
          />

          <button
            type="button"
            onClick={addItem}
            disabled={loading || sessionLoading}
            className="mt-3 w-full rounded-2xl bg-white px-4 py-4 text-base font-semibold text-black disabled:opacity-60"
          >
            {loading ? "Ищу товар..." : "Добавить"}
          </button>

          {message ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-zinc-300">
              {message}
            </div>
          ) : null}
        </section>

        <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">
            Скидка
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {[0, 5, 10, 20].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDiscountPercent(String(value))}
                className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${
                  discount === value
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-black text-white"
                }`}
              >
                {value}%
              </button>
            ))}
          </div>

          <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-zinc-500">
            Свой процент скидки
          </label>

          <input
            value={discountPercent}
            onChange={(event) => setDiscountPercent(event.target.value)}
            inputMode="numeric"
            placeholder="Например 20"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-base text-white outline-none placeholder:text-zinc-600"
          />
        </section>

        <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">
            Текущий чек
          </div>

          {items.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4 text-sm text-zinc-500">
              Пока товаров нет.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div
                  key={String(item.productId)}
                  className="rounded-2xl border border-white/10 bg-black p-4"
                >
                  <div className="text-base font-semibold text-white">
                    {item.name}
                  </div>

                  <div className="mt-1 text-xs leading-5 text-zinc-500">
                    {item.article ? `Арт: ${item.article}` : ""}
                    {item.article && item.barcode ? " · " : ""}
                    {item.barcode ? `ШК: ${item.barcode}` : ""}
                    {item.stockQty !== null ? ` · Остаток: ${item.stockQty}` : ""}
                    {` · ${item.store}`}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => decreaseItem(item.productId)}
                      className="rounded-xl border border-white/10 px-3 py-3 text-lg"
                    >
                      −
                    </button>

                    <div className="rounded-xl border border-white/10 px-3 py-3 text-center text-sm">
                      {item.qty} шт.
                    </div>

                    <button
                      type="button"
                      onClick={() => increaseItem(item.productId)}
                      className="rounded-xl border border-white/10 px-3 py-3 text-lg"
                    >
                      +
                    </button>
                  </div>

                  <label className="mt-3 block text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Цена продажи до скидки
                  </label>

                  <input
                    value={String(item.price)}
                    onChange={(event) =>
                      changePrice(item.productId, event.target.value)
                    }
                    inputMode="numeric"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-white outline-none"
                  />

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-sm text-zinc-400">
                      {formatMoney(item.price)} × {item.qty}
                    </div>

                    <div className="text-base font-semibold">
                      {formatMoney(item.price * item.qty)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span>До скидки</span>
              <span>{formatMoney(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-zinc-400">
              <span>Скидка {discount}%</span>
              <span>-{formatMoney(discountAmount)}</span>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-zinc-400">Итого</span>
              <span className="text-2xl font-semibold text-white">
                {formatMoney(total)}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setItems([]);
                setDiscountPercent("0");
                setMessage("Чек очищен.");
              }}
              className="rounded-2xl border border-white/10 px-4 py-4 text-sm font-semibold text-white"
            >
              Очистить
            </button>

            <button
              type="button"
              onClick={sell}
              disabled={selling || items.length === 0 || !currentStore}
              className="rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-black disabled:opacity-50"
            >
              {selling ? "Сохраняю..." : "Продать"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}