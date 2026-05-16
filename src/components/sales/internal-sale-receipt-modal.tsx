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

export function InternalSaleReceiptModal(props: Props) {
  if (!props.isOpen) return null;

  const shortLines = props.lines.slice(0, 2);
  const extraLines = Math.max(0, props.lines.length - shortLines.length);

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 p-4 receipt-print-shell">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#111] p-4 receipt-print-card">
        <div className="mb-3 text-lg font-semibold no-print">Внутренний чек продажи</div>

        <div className="receipt-label rounded border border-dashed border-zinc-300 bg-white text-black">
          <div className="text-center text-[10px] font-bold">BAC</div>
          <div className="text-center text-[10px] font-bold">ВНУТРЕННИЙ ЧЕК</div>
          <div className="mt-1">{props.store}</div>
          <div>Продажа #{props.saleId}</div>
          <div>{new Date(props.createdAt).toLocaleString("ru-RU")}</div>
          <div>Кассир: {props.cashier}</div>
          <div>Товаров: {props.itemsCount}</div>
          <div>До скидки: {formatMoney(props.subtotal)}</div>
          <div>Скидка {props.discountPercent}%: -{formatMoney(props.discountAmount)}</div>
          <div className="font-semibold">Итог: {formatMoney(props.total)}</div>
          <div>Оплата: {props.paymentMethod}</div>

          {props.lines.length === 1 ? (
            <div className="mt-1 border-t border-black pt-1">
              <div>{props.lines[0].name}</div>
              <div>Арт: {props.lines[0].article || "—"}</div>
              <div>Размер: {props.lines[0].size || "—"}</div>
              <div>Цвет: {props.lines[0].color || "—"}</div>
              <div>ШК: {props.lines[0].barcode || "—"}</div>
              <div>Цена: {formatMoney(props.lines[0].unitPrice)}</div>
              <div>Итог: {formatMoney(props.lines[0].lineTotal)}</div>
            </div>
          ) : (
            <div className="mt-1 border-t border-black pt-1">
              {shortLines.map((line, idx) => (
                <div key={`${line.barcode || line.name}-${idx}`}>{line.name}</div>
              ))}
              {extraLines > 0 ? <div>+ ещё {extraLines} тов.</div> : null}
            </div>
          )}

          <div className="mt-1 text-center">Спасибо за покупку</div>
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
