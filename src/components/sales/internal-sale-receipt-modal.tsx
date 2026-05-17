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

function formatStoreName(store: string): string {
  if (store === "Магазин 1") return "BAC BOUTIQUE";
  if (store === "Магазин 2") return "MEN OUTFIT";
  return store;
}

function hasValue(value?: string): boolean {
  const text = String(value ?? "").trim();
  return Boolean(text && text !== "—");
}

export function InternalSaleReceiptModal(props: Props) {
  if (!props.isOpen) return null;

  const shortLines = props.lines.slice(0, 2);
  const extraLines = Math.max(0, props.lines.length - shortLines.length);

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 p-4 receipt-print-shell">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#111] p-4 receipt-print-card">
        <div className="mb-3 text-lg font-semibold no-print">Внутренний чек продажи</div>

        <div className="receipt-label mx-auto rounded bg-white text-black shadow-2xl">
          <div className="text-center text-[10px] font-semibold tracking-[0.12em] uppercase">
            {formatStoreName(props.store)}
          </div>
          <div className="mt-[1px] text-center text-[10px] font-bold tracking-[0.08em]">
            ВНУТРЕННИЙ ЧЕК
          </div>
          <div className="my-1 border-t border-black/40" />

          <div>Продажа №{props.saleId}</div>
          <div>Дата: {new Date(props.createdAt).toLocaleString("ru-RU")}</div>
          <div>Кассир: {props.cashier}</div>
          <div>Товаров: {props.itemsCount}</div>

          <div className="my-1 border-t border-black/40" />
          <div className="mb-[1px] font-semibold">Товары:</div>

          {props.lines.length === 1 ? (
            <div>
              <div className="font-medium leading-tight">{props.lines[0].name}</div>
              {hasValue(props.lines[0].barcode) ? <div>ШК: {props.lines[0].barcode}</div> : null}
              {hasValue(props.lines[0].article) ? <div>Арт: {props.lines[0].article}</div> : null}
              {hasValue(props.lines[0].size) ? <div>Размер: {props.lines[0].size}</div> : null}
              {hasValue(props.lines[0].color) ? <div>Цвет: {props.lines[0].color}</div> : null}
              <div className="mt-[1px]">
                {formatMoney(props.lines[0].unitPrice)} × {props.lines[0].qty} = {formatMoney(props.lines[0].lineTotal)}
              </div>
            </div>
          ) : (
            <div>
              {shortLines.map((line, idx) => (
                <div key={`${line.barcode || line.name}-${idx}`} className="mb-[2px]">
                  <div className="font-medium leading-tight">{line.name}</div>
                  <div>
                    {formatMoney(line.unitPrice)} × {line.qty} = {formatMoney(line.lineTotal)}
                  </div>
                </div>
              ))}
              {extraLines > 0 ? <div>+ ещё {extraLines} тов.</div> : null}
            </div>
          )}

          <div className="my-1 border-t border-black/40" />
          <div className="flex items-center justify-between">
            <span>До скидки</span>
            <span>{formatMoney(props.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Скидка {props.discountPercent}%</span>
            <span>-{formatMoney(props.discountAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Оплата</span>
            <span className="uppercase">{props.paymentMethod}</span>
          </div>
          <div className="mt-[1px] flex items-center justify-between text-[11px] font-bold tracking-[0.08em]">
            <span>ИТОГО</span>
            <span>{formatMoney(props.total)}</span>
          </div>

          <div className="mt-1 pt-[2px] text-center text-[8px] uppercase tracking-[0.14em]">
            Спасибо за покупку
          </div>
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
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-xl border border-white/20 px-3 py-2"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
