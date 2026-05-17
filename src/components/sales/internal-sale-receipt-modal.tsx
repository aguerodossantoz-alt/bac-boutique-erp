"use client";

type ReceiptLine = {
  name: string;
  article?: string;
  size?: string;
  color?: string;
  barcode?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

type Props = {
  isOpen: boolean;
  saleId: number;
  createdAt: string;
  store: string;
  cashier: string;
  paymentMethod: string;
  itemsCount: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  lines: ReceiptLine[];
  onClose: () => void;
  onPrinted?: () => void;
};

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(value || 0))} ₽`;
}

function resolveReceiptStore(store: string): string {
  const value = String(store ?? "").trim();
  if (value === "Магазин 1") return "BAC BOUTIQUE";
  if (value === "Магазин 2") return "MEN OUTFIT";
  return value || "BAC BOUTIQUE";
}

function hasText(value?: string): boolean {
  const text = String(value ?? "").trim();
  return Boolean(text && text !== "—");
}

export function InternalSaleReceiptModal(props: Props) {
  if (!props.isOpen) return null;

  const receiptStore = resolveReceiptStore(props.store);

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 p-4 receipt-print-shell">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#111] p-4 receipt-print-card">
        <div className="mb-3 text-lg font-semibold no-print">Внутренний чек продажи</div>

        <div className="receipt-label bg-white text-black">
          <div className="text-center text-[11px] font-bold tracking-wide">{receiptStore}</div>
          <div className="mt-1 text-center text-[10px] font-semibold tracking-[0.08em]">ВНУТРЕННИЙ ЧЕК</div>
          <div className="my-2 border-t border-black" />

          <div>Продажа № {props.saleId}</div>
          <div>Дата: {new Date(props.createdAt).toLocaleString("ru-RU")}</div>
          <div>Кассир: {props.cashier}</div>
          <div>Товаров: {props.itemsCount}</div>

          <div className="my-2 border-t border-black" />

          <div className="font-semibold">Товары:</div>
          <div className="mt-1 space-y-1">
            {props.lines.map((line, idx) => (
              <div key={`${line.name}-${line.barcode || idx}`}>
                <div>{line.name}</div>
                <div className="text-[8px] leading-tight">
                  {hasText(line.barcode) ? <div>ШК: {line.barcode}</div> : null}
                  {hasText(line.article) ? <div>Арт: {line.article}</div> : null}
                  {hasText(line.size) ? <div>Размер: {line.size}</div> : null}
                  {hasText(line.color) ? <div>Цвет: {line.color}</div> : null}
                </div>
                <div>{formatMoney(line.unitPrice)} × {line.qty} = {formatMoney(line.lineTotal)}</div>
              </div>
            ))}
          </div>

          <div className="my-2 border-t border-black" />

          <div>До скидки: {formatMoney(props.subtotal)}</div>
          <div>Скидка {props.discountPercent}%: -{formatMoney(props.discountAmount)}</div>
          <div>Оплата: {props.paymentMethod}</div>
          <div className="mt-1 text-[11px] font-extrabold tracking-wide">ИТОГО: {formatMoney(props.total)}</div>

          <div className="mt-3 text-center">Спасибо за покупку</div>
        </div>

        <div className="mt-3 flex gap-2 no-print">
          <button
            type="button"
            onClick={() => {
              window.print();
              props.onPrinted?.();
            }}
            className="flex-1 rounded-xl bg-white px-3 py-2 text-black"
          >
            Печать
          </button>
          <button type="button" onClick={props.onClose} className="rounded-xl border border-white/20 px-3 py-2">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
