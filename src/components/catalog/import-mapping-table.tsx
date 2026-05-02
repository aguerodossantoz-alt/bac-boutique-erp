"use client";

import { useState } from "react";
import { importColumns, systemFields } from "@/data/import-mapping-data";

export function ImportMappingTable() {
  const [mapping, setMapping] = useState(
    importColumns.map((item) => ({
      ...item,
      selected: item.target,
    }))
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Сопоставление колонок
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Настройка импорта
          </h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-400">
          Выбери, в какое поле системы загружать каждую колонку
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-white/[0.04] text-sm text-zinc-400">
            <tr>
              <th className="px-4 py-4 font-medium">Колонка из файла</th>
              <th className="px-4 py-4 font-medium">Поле системы</th>
              <th className="px-4 py-4 font-medium">Обязательное</th>
              <th className="px-4 py-4 font-medium">Статус</th>
            </tr>
          </thead>

          <tbody>
            {mapping.map((row, index) => (
              <tr
                key={row.source}
                className="border-t border-white/10 bg-[#090909] text-sm"
              >
                <td className="px-4 py-4 text-zinc-300">{row.source}</td>

                <td className="px-4 py-4">
                  <select
                    value={row.selected}
                    onChange={(e) => {
                      const value = e.target.value;
                      setMapping((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, selected: value } : item
                        )
                      );
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                  >
                    {systemFields.map((field) => (
                      <option key={field} value={field} className="bg-black">
                        {field}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-4">
                  {row.required ? (
                    <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs text-red-300">
                      Да
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
                      Нет
                    </span>
                  )}
                </td>

                <td className="px-4 py-4">
                  {row.selected === "skip" ? (
                    <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-300">
                      Пропустить
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                      Сопоставлено
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}