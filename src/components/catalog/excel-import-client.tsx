"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

type ImportRow = {
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

const SHEET_NAME = "program_import_master";
const STORAGE_KEY = "bac-boutique-catalog-import-v1";

const REQUIRED_COLUMNS: Array<keyof ImportRow> = [
  "barcode",
  "name",
  "article",
  "promo_price",
  "purchase_price",
  "retail_price",
  "stock_qty",
  "store",
  "item_status",
];

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toFixed(0) : String(value);
  }

  const text = String(value).trim();

  if (/^\d+(\.\d+)?e[+-]?\d+$/i.test(text)) {
    const numericValue = Number(text);
    if (Number.isFinite(numericValue)) {
      return Number.isInteger(numericValue)
        ? numericValue.toFixed(0)
        : String(numericValue);
    }
  }

  return text;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "").trim();
}

export function ExcelImportClient() {
  const router = useRouter();

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [error, setError] = useState("");
  const [sheetInfo, setSheetInfo] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setRows([]);
    setSaveMessage("");
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      setSheetInfo(workbook.SheetNames);

      const sheet = workbook.Sheets[SHEET_NAME];
      if (!sheet) {
        setError(
          `Лист "${SHEET_NAME}" не найден. Найдены листы: ${workbook.SheetNames.join(", ")}`
        );
        return;
      }

      const headerMatrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
        header: 1,
        raw: false,
        defval: "",
      });

      const headerRow = (headerMatrix[0] ?? []).map(normalizeHeader);
      const missingColumns = REQUIRED_COLUMNS.filter(
        (column) => !headerRow.includes(column)
      );

      if (missingColumns.length > 0) {
        setError(
          `На листе "${SHEET_NAME}" не хватает колонок: ${missingColumns.join(", ")}`
        );
        return;
      }

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: true,
        blankrows: false,
      });

      const preparedRows: ImportRow[] = rawRows
        .map((rawRow) => {
          const cleanedRow = Object.fromEntries(
            Object.entries(rawRow).map(([key, value]) => [
              normalizeHeader(key),
              value,
            ])
          ) as Record<string, unknown>;

          return {
            barcode: normalizeCell(cleanedRow.barcode),
            name: normalizeCell(cleanedRow.name),
            article: normalizeCell(cleanedRow.article),
            promo_price: normalizeCell(cleanedRow.promo_price),
            purchase_price: normalizeCell(cleanedRow.purchase_price),
            retail_price: normalizeCell(cleanedRow.retail_price),
            stock_qty: normalizeCell(cleanedRow.stock_qty),
            store: normalizeCell(cleanedRow.store),
            item_status: normalizeCell(cleanedRow.item_status),
          };
        })
        .filter((row) => row.barcode || row.name);

      if (preparedRows.length === 0) {
        setError(`На листе "${SHEET_NAME}" нет строк с товарами.`);
        return;
      }

      setRows(preparedRows);
    } catch (unknownError) {
      const message =
        unknownError instanceof Error
          ? unknownError.message
          : "Не удалось прочитать Excel-файл.";
      setError(message);
    } finally {
      event.target.value = "";
    }
  }

  async function handleImportToCatalog() {
    if (rows.length === 0) return;

    setIsImporting(true);
    setError("");
    setSaveMessage("");

    try {
      const response = await fetch("/api/products/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Ошибка импорта в Product.");
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
      localStorage.setItem(
        `${STORAGE_KEY}:meta`,
        JSON.stringify({
          fileName,
          importedAt: new Date().toISOString(),
          total: rows.length,
        })
      );

      setSaveMessage(
        `Импорт завершен. В Product сохранено: ${result.importedCount} товаров.`
      );

      setTimeout(() => {
        router.push("/catalog");
      }, 700);
    } catch (unknownError) {
      const message =
        unknownError instanceof Error
          ? unknownError.message
          : "Не удалось импортировать товары.";
      setError(message);
    } finally {
      setIsImporting(false);
    }
  }

  const summary = useMemo(() => {
    const total = rows.length;
    const readyForSale = rows.filter(
      (row) => row.item_status === "READY_FOR_SALE"
    ).length;
    const withArticle = rows.filter((row) => row.article).length;
    const withPromo = rows.filter((row) => row.promo_price).length;
    const withRetail = rows.filter((row) => row.retail_price).length;
    const withStock = rows.filter((row) => row.stock_qty).length;

    return {
      total,
      readyForSale,
      withArticle,
      withPromo,
      withRetail,
      withStock,
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Реальный импорт Excel
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Загрузка каталога в ERP
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
              Загрузите Excel-файл и система прочитает лист{" "}
              <span className="text-white">{SHEET_NAME}</span>.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-medium text-white transition hover:bg-white/[0.08]">
              Выбрать Excel-файл
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <button
              type="button"
              onClick={handleImportToCatalog}
              disabled={rows.length === 0 || isImporting}
              className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isImporting ? "Импорт идет..." : "Импортировать в Product"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="text-sm text-zinc-500">Файл</div>
            <div className="mt-2 text-sm text-white">
              {fileName || "Пока не выбран"}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="text-sm text-zinc-500">Всего строк</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {summary.total}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="text-sm text-zinc-500">READY_FOR_SALE</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {summary.readyForSale}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="text-sm text-zinc-500">С артикулами</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {summary.withArticle}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="text-sm text-zinc-500">С акц. ценой</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {summary.withPromo}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <div className="text-sm text-zinc-500">С розн. ценой</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {summary.withRetail}
            </div>
          </div>
        </div>

        {sheetInfo.length > 0 && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-[#090909] p-4 text-sm text-zinc-300">
            Листы в файле: <span className="text-white">{sheetInfo.join(", ")}</span>
          </div>
        )}

        {saveMessage && (
          <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {saveMessage}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Предпросмотр
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Первые 30 товаров
            </h2>
          </div>

          <div className="text-sm text-zinc-400">
            С остатком: <span className="text-white">{summary.withStock}</span>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-white/[0.04] text-zinc-400">
              <tr>
                <th className="px-4 py-4 font-medium">barcode</th>
                <th className="px-4 py-4 font-medium">name</th>
                <th className="px-4 py-4 font-medium">article</th>
                <th className="px-4 py-4 font-medium">promo_price</th>
                <th className="px-4 py-4 font-medium">retail_price</th>
                <th className="px-4 py-4 font-medium">stock_qty</th>
                <th className="px-4 py-4 font-medium">store</th>
                <th className="px-4 py-4 font-medium">item_status</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map((row, index) => (
                <tr
                  key={`${row.barcode}-${index}`}
                  className="border-t border-white/10 bg-[#090909]"
                >
                  <td className="px-4 py-4 text-zinc-300">{row.barcode}</td>
                  <td className="px-4 py-4 text-white">{row.name}</td>
                  <td className="px-4 py-4 text-zinc-300">{row.article}</td>
                  <td className="px-4 py-4 text-zinc-300">{row.promo_price}</td>
                  <td className="px-4 py-4 text-zinc-300">{row.retail_price}</td>
                  <td className="px-4 py-4 text-zinc-300">{row.stock_qty}</td>
                  <td className="px-4 py-4 text-zinc-300">{row.store}</td>
                  <td className="px-4 py-4 text-zinc-300">{row.item_status}</td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    Пока ничего не загружено.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}