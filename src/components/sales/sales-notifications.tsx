"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SalesNotificationsProps = {
  role: "owner" | "admin" | "manager" | "cashier";
  store: string;
};

type ProductRow = {
  id: number;
  barcode: string;
  name: string;
  promo_price: string;
  purchase_price: string;
  retail_price: string;
  store: string;
};

type SaleLine = {
  id: number;
  productId: number;
  barcode: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  store: string;
};

type SaleRow = {
  id: number;
  total: number;
  createdAt?: string;
  itemsCount?: number;
  store?: string;
  lines?: SaleLine[];
};

type NotificationLine = {
  productId: number;
  barcode: string;
  name: string;
  qty: number;
  soldUnitPrice: number;
  soldLineTotal: number;
  baseUnitPrice: number;
  purchaseUnitPrice: number;
  discountTotal: number;
  costTotal: number;
  profitTotal: number;
};

type NotificationState = {
  id: number;
  total: number;
  store: string;
  itemsCount: number;
  discountTotal: number;
  costTotal: number;
  profitTotal: number;
  lines: NotificationLine[];
};

function parseNumber(value: unknown): number {
  const text = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : 0;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(value))} ₽`;
}

function normalizeStore(store: string) {
  const text = String(store || "").trim();
  if (!text || text.toLowerCase() === "all" || text === "Все магазины") {
    return "";
  }
  return text;
}

export function SalesNotifications({ role, store }: SalesNotificationsProps) {
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );

  const initializedRef = useRef(false);
  const lastSeenSaleIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const canShowNotifications = role === "owner" || role === "admin";
  const activeStore = normalizeStore(store);

  const salesUrl = useMemo(() => {
    return activeStore
      ? `/api/sales?store=${encodeURIComponent(activeStore)}`
      : "/api/sales";
  }, [activeStore]);

  const productsUrl = useMemo(() => {
    return activeStore
      ? `/api/products?store=${encodeURIComponent(activeStore)}`
      : "/api/products";
  }, [activeStore]);

  useEffect(() => {
    if (!canShowNotifications) return;

    let isMounted = true;

    async function loadProductsMap() {
      const response = await fetch(productsUrl, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        return new Map<string, ProductRow>();
      }

      const rows: ProductRow[] = Array.isArray(result.rows) ? result.rows : [];
      const map = new Map<string, ProductRow>();

      for (const product of rows) {
        map.set(`id:${product.id}`, product);
        map.set(`barcode:${product.barcode}`, product);
      }

      return map;
    }

    function buildNotification(
      sale: SaleRow,
      productsMap: Map<string, ProductRow>
    ): NotificationState {
      const saleLines = Array.isArray(sale.lines) ? sale.lines : [];

      const lines: NotificationLine[] = saleLines.map((line) => {
        const product =
          productsMap.get(`id:${line.productId}`) ||
          productsMap.get(`barcode:${line.barcode}`);

        const qty = Number(line.qty || 0);
        const soldUnitPrice = Number(line.unitPrice || 0);
        const soldLineTotal = Number(line.lineTotal || soldUnitPrice * qty);

        const baseUnitPrice =
          parseNumber(product?.promo_price) ||
          parseNumber(product?.retail_price) ||
          soldUnitPrice;

        const purchaseUnitPrice = parseNumber(product?.purchase_price);

        const discountPerUnit = Math.max(baseUnitPrice - soldUnitPrice, 0);
        const discountTotal = roundMoney(discountPerUnit * qty);
        const costTotal = roundMoney(purchaseUnitPrice * qty);
        const profitTotal = roundMoney(soldLineTotal - costTotal);

        return {
          productId: line.productId,
          barcode: line.barcode,
          name: line.name,
          qty,
          soldUnitPrice,
          soldLineTotal,
          baseUnitPrice,
          purchaseUnitPrice,
          discountTotal,
          costTotal,
          profitTotal,
        };
      });

      const discountTotal = roundMoney(
        lines.reduce((sum, line) => sum + line.discountTotal, 0)
      );

      const costTotal = roundMoney(
        lines.reduce((sum, line) => sum + line.costTotal, 0)
      );

      const profitTotal = roundMoney(
        lines.reduce((sum, line) => sum + line.profitTotal, 0)
      );

      const saleStore =
        sale.store || saleLines[0]?.store || activeStore || "Все магазины";

      return {
        id: sale.id,
        total: Number(sale.total || 0),
        store: saleStore,
        itemsCount: Number(sale.itemsCount || saleLines.length || 0),
        discountTotal,
        costTotal,
        profitTotal,
        lines,
      };
    }

    async function checkLatestSale() {
      try {
        const response = await fetch(salesUrl, {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) return;

        const rows: SaleRow[] = Array.isArray(result.rows) ? result.rows : [];

        if (rows.length === 0) return;

        const latestSale = rows.reduce((latest, sale) => {
          return sale.id > latest.id ? sale : latest;
        }, rows[0]);

        const latestSaleId = Number(latestSale.id || 0);
        if (!latestSaleId) return;

        if (!initializedRef.current) {
          initializedRef.current = true;
          lastSeenSaleIdRef.current = latestSaleId;
          return;
        }

        const lastSeenSaleId = lastSeenSaleIdRef.current ?? latestSaleId;

        if (latestSaleId > lastSeenSaleId) {
          lastSeenSaleIdRef.current = latestSaleId;

          const productsMap = await loadProductsMap();
          const nextNotification = buildNotification(latestSale, productsMap);

          if (!isMounted) return;

          setNotification(nextNotification);

          if (timerRef.current) {
            window.clearTimeout(timerRef.current);
          }

          timerRef.current = window.setTimeout(() => {
            setNotification(null);
          }, 30000);
        }
      } catch (error) {
        console.error("Ошибка проверки новых продаж:", error);
      }
    }

    checkLatestSale();

    const intervalId = window.setInterval(checkLatestSale, 4000);

    function handleFocus() {
      checkLatestSale();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkLatestSale();
      }
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [canShowNotifications, activeStore, salesUrl, productsUrl]);

  if (!canShowNotifications || !notification) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 top-[calc(4.5rem+env(safe-area-inset-top))] z-[99999] sm:inset-x-auto sm:right-6 sm:top-6 sm:w-[440px]">
      <div className="max-h-[75dvh] overflow-y-auto rounded-3xl border border-emerald-400/30 bg-[#06140f] p-5 text-white shadow-2xl shadow-emerald-950/40">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-300">
              Новая продажа
            </div>

            <div className="mt-2 text-xl font-semibold text-white">
              Продажа #{notification.id}
            </div>

            <div className="mt-1 text-sm text-zinc-300">
              {notification.store} · Позиций: {notification.itemsCount}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setNotification(null)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-zinc-300 transition hover:bg-white/[0.08]"
          >
            ×
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-zinc-500">Выручка</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {formatMoney(notification.total)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-zinc-500">Скидка</div>
            <div className="mt-1 text-lg font-semibold text-amber-300">
              {formatMoney(notification.discountTotal)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-zinc-500">Закупка</div>
            <div className="mt-1 text-lg font-semibold text-zinc-200">
              {formatMoney(notification.costTotal)}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
            <div className="text-xs text-emerald-300">Прибыль</div>
            <div className="mt-1 text-lg font-semibold text-emerald-300">
              {formatMoney(notification.profitTotal)}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {notification.lines.map((line) => (
            <div
              key={`${line.productId}-${line.barcode}`}
              className="rounded-2xl border border-white/10 bg-black/30 p-4"
            >
              <div className="break-words text-sm font-medium text-white">
                {line.name}
              </div>

              <div className="mt-1 break-all text-xs text-zinc-500">
                {line.barcode}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-zinc-500">Кол-во</div>
                  <div className="text-zinc-200">{line.qty}</div>
                </div>

                <div>
                  <div className="text-xs text-zinc-500">Цена продажи</div>
                  <div className="text-zinc-200">
                    {formatMoney(line.soldUnitPrice)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-500">Сумма</div>
                  <div className="text-zinc-200">
                    {formatMoney(line.soldLineTotal)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-500">Скидка</div>
                  <div className="text-amber-300">
                    {formatMoney(line.discountTotal)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-500">Закупка</div>
                  <div className="text-zinc-200">
                    {formatMoney(line.costTotal)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-emerald-300">Прибыль</div>
                  <div className="font-semibold text-emerald-300">
                    {formatMoney(line.profitTotal)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {notification.lines.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-400">
              Состав продажи не найден, но продажа создана.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}