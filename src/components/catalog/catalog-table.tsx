"use client";

import { useMemo, useState } from "react";
import { catalogItems } from "@/data/catalog-data";

export function CatalogTable() {
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("Все магазины");

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return catalogItems.filter((item) => {
      const matchesStore =
        storeFilter === "Все магазины" || item.store === storeFilter;

      const matchesSearch =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.article.toLowerCase().includes(query) ||
        item.color.toLowerCase().includes(query) ||
        item.barcode.toLowerCase().includes(query) ||
        item.size.toLowerCase().includes(query);

      return matchesStore && matchesSearch;
    });
  }, [search, storeFilter]);

  const store1Count = catalogItems.filter(
    (item) => item.store === "Магазин 1"
  ).length;

  const store2Count = catalogItems.filter(
    (item) => item.store === "Магазин 2"
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm text-zinc-500">Показано позиций</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {filteredItems.length}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm text-zinc-500">Магазин 1</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {store1Count}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm text-zinc-500">Магазин 2</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {store2Count}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm text-zinc-500">Три цены</div>
          <div className="mt-3 text-3xl font-semibold text-white">Да</div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Таблица каталога
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Товары бутика
            </h2>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск: товар, артикул, цвет, размер, штрихкод"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 md:w-[420px]"
            />

            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
            >
              <option className="bg-black" value="Все магазины">
                Все магазины
              </option>
              <option className="bg-black" value="Магазин 1">
                Магазин 1
              </option>
              <option className="bg-black" value="Магазин 2">
                Магазин 2
              </option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setStoreFilter("Все магазины")}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              storeFilter === "Все магазины"
                ? "border-white/15 bg-white/10 text-white"
                : "border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white"
            }`}
          >
            Все магазины
          </button>

          <button
            type="button"
            onClick={() => setStoreFilter("Магазин 1")}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              storeFilter === "Магазин 1"
                ? "border-white/15 bg-white/10 text-white"
                : "border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white"
            }`}
          >
            Магазин 1
          </button>

          <button
            type="button"
            onClick={() => setStoreFilter("Магазин 2")}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              storeFilter === "Магазин 2"
                ? "border-white/15 bg-white/10 text-white"
                : "border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white"
            }`}
          >
            Магазин 2
          </button>
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-white/[0.04] text-sm text-zinc-400">
              <tr>
                <th className="px-4 py-4 font-medium">Товар</th>
                <th className="px-4 py-4 font-medium">Артикул</th>
                <th className="px-4 py-4 font-medium">Размер</th>
                <th className="px-4 py-4 font-medium">Цвет</th>
                <th className="px-4 py-4 font-medium">Штрихкод</th>
                <th className="px-4 py-4 font-medium">Закупка</th>
                <th className="px-4 py-4 font-medium">Акция</th>
                <th className="px-4 py-4 font-medium">Розница</th>
                <th className="px-4 py-4 font-medium">Остаток</th>
                <th className="px-4 py-4 font-medium">Магазин</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr
                    key={item.barcode}
                    className="border-t border-white/10 bg-[#090909] text-sm text-white"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-zinc-400">
                          Фото
                        </div>
                        <div>
                          <div className="font-medium text-white">{item.name}</div>
                          <div className="mt-1 text-xs text-zinc-500">
                            Карточка товара
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-zinc-300">{item.article}</td>
                    <td className="px-4 py-4 text-zinc-300">{item.size}</td>
                    <td className="px-4 py-4 text-zinc-300">{item.color}</td>
                    <td className="px-4 py-4 text-zinc-300">{item.barcode}</td>
                    <td className="px-4 py-4 text-zinc-300">
                      {item.purchasePrice}
                    </td>
                    <td className="px-4 py-4 font-medium text-zinc-100">
                      {item.promoPrice}
                    </td>
                    <td className="px-4 py-4 text-zinc-300">
                      {item.retailPrice}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white">
                        {item.stock} шт
                      </span>
                    </td>
                    <td className="px-4 py-4 text-zinc-300">{item.store}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-white/10 bg-[#090909]">
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    Ничего не найдено по этому запросу
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