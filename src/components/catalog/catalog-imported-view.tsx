"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CatalogItem = {
  id?: number;
  isNew?: boolean;
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

export function CatalogImportedView() {
  const router = useRouter();
async function saveDraftToProduct() {
  if (!draft) {
    setSaveMessage("Нет открытой карточки товара.");
    return;
  }
const payload = {
  barcode: draft.barcode,
  article: draft.article,
  name: draft.name,
  promo_price: draft.promo_price,
  purchase_price: draft.purchase_price,
  retail_price: draft.retail_price,
  stock_qty: draft.stock_qty,
  store: draft.store,
  item_status: draft.item_status,
  image_url: draft.image_url ?? "",
};
  try {
    setSaveMessage("");

    if (draft.isNew) {
      const createResponse = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const createText = await createResponse.text();
let createResult: any = {};

try {
  createResult = createText ? JSON.parse(createText) : {};
} catch {
  createResult = { error: createText };
}

      if (!createResponse.ok) {
        throw new Error(createResult?.error || "Ошибка создания товара.");
      }

      const createdRow = createResult?.row;

      setSaveMessage("Новый товар создан в Product.");
      await loadCatalogFromDbFirst();
      router.refresh();

      if (createdRow) {
        setDraft({
          id: createdRow.id,
          isNew: false,
          barcode: String(createdRow.barcode ?? ""),
          name: String(createdRow.name ?? ""),
          article: String(createdRow.article ?? ""),
          promo_price: String(createdRow.promo_price ?? ""),
          purchase_price: String(createdRow.purchase_price ?? ""),
          retail_price: String(createdRow.retail_price ?? ""),
          stock_qty: String(createdRow.stock_qty ?? ""),
          store: String(createdRow.store ?? ""),
          item_status: String(createdRow.item_status ?? "READY_FOR_SALE"),
          image_url: String(createdRow.image_url ?? ""),
        });
      } else {
        setDraft(null);
      }

      return;
    }

    if (!draft.id) {
      setSaveMessage("У товара нет id из Product.");
      return;
    }

    const updateResponse = await fetch(`/api/products/${draft.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const updateText = await updateResponse.text();
let updateResult: any = {};

try {
  updateResult = updateText ? JSON.parse(updateText) : {};
} catch {
  updateResult = { error: updateText };
}

    if (!updateResponse.ok) {
      throw new Error(updateResult?.error || "Ошибка сохранения товара.");
    }

    const updatedRow = updateResult?.row;

    if (updatedRow) {
      setDraft({
        id: updatedRow.id,
        isNew: false,
        barcode: String(updatedRow.barcode ?? ""),
        name: String(updatedRow.name ?? ""),
        article: String(updatedRow.article ?? ""),
        promo_price: String(updatedRow.promo_price ?? ""),
        purchase_price: String(updatedRow.purchase_price ?? ""),
        retail_price: String(updatedRow.retail_price ?? ""),
        stock_qty: String(updatedRow.stock_qty ?? ""),
        store: String(updatedRow.store ?? ""),
        item_status: String(updatedRow.item_status ?? "READY_FOR_SALE"),
        image_url: String(updatedRow.image_url ?? ""),
      });
    }

    await loadCatalogFromDbFirst();
    router.refresh();
    setSaveMessage("Товар сохранен в Product.");
  } catch (error) {
    console.error("Ошибка сохранения карточки:", error);
    setSaveMessage(
      error instanceof Error ? error.message : "Ошибка сохранения товара."
    );
  }
}

async function deleteDraftFromProduct() {
  if (!draft || !draft.id) {
    setSaveMessage("Удалять пока нечего.");
    return;
  }

  const confirmed = window.confirm(`Удалить товар "${draft.name}" из Product?`);
  if (!confirmed) return;

  try {
    setSaveMessage("");

    const response = await fetch(`/api/products/${draft.id}`, {
      method: "DELETE",
    });

    const rawText = await response.text();
    let result: any = null;

    try {
      result = rawText ? JSON.parse(rawText) : null;
    } catch {
      result = null;
    }

    if (!response.ok) {
      throw new Error(result?.error || "Не удалось удалить товар.");
    }

    setDraft(null);
    await loadCatalogFromDbFirst();
    router.refresh();
    setSaveMessage("Товар удален.");
  } catch (error) {
    console.error("Ошибка удаления товара:", error);
    setSaveMessage(
      error instanceof Error ? error.message : "Ошибка удаления товара."
    );
  }
}
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState("Все магазины");
  const [loaded, setLoaded] = useState(false);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<CatalogItem | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<"success" | "error" | null>(null);
  const STORE_OPTIONS = ["Все магазины", "Магазин 1", "Магазин 2"];
const STATUS_OPTIONS = ["READY_FOR_SALE", "DRAFT", "MANUAL_REVIEW"];
async function loadCatalogFromDbFirst(showStatus = false) {
  if (showStatus) {
    setIsRefreshing(true);
    setRefreshMessage(null);
  }

  try {
    const response = await fetch("/api/products", {
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error || "Не удалось прочитать Product.");
    }

    setItems(Array.isArray(result.rows) ? result.rows : []);

    if (showStatus) {
      setRefreshMessage("success");
    }
  } catch (error) {
    console.error("Ошибка загрузки Product API:", error);
    setItems([]);

    if (showStatus) {
      setRefreshMessage("error");
    }
  } finally {
    setLoaded(true);

    if (showStatus) {
      setIsRefreshing(false);
    }
  }
}
useEffect(() => {
  loadCatalogFromDbFirst();
}, []);

const stores = STORE_OPTIONS;

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();

    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const matchesStore =
          storeFilter === "Все магазины" || item.store === storeFilter;

        const matchesSearch =
          !search ||
          item.name.toLowerCase().includes(search) ||
          item.article.toLowerCase().includes(search) ||
          item.barcode.toLowerCase().includes(search);

        return matchesStore && matchesSearch;
      });
  }, [items, query, storeFilter]);

  const stats = useMemo(() => {
    const total = items.length;
    const ready = items.filter(
      (item) => item.item_status === "READY_FOR_SALE"
    ).length;
    const withRetail = items.filter((item) => item.retail_price).length;
    const withPromo = items.filter((item) => item.promo_price).length;

    return {
      total,
      ready,
      withRetail,
      withPromo,
    };
  }, [items]);

  function openItem(index: number) {
    setSelectedIndex(index);
    setDraft({ ...items[index] });
  }

  function closeItem() {
    setSelectedIndex(null);
    setDraft(null);
  }

  function updateDraft(field: keyof CatalogItem, value: string) {
    if (!draft) return;
    setDraft({
      ...draft,
      [field]: value,
    });
  }

  if (!loaded) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-zinc-300">
        Загрузка каталога...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Каталог
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Каталог пока пуст
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
            Добавьте первый товар через кнопку «Новый товар». После сохранения он появится в каталоге и в базе данных.
          </p>

          <Link
            href="/catalog/import"
            className="mt-6 inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white transition hover:bg-white/[0.08]"
          >
Добавить товар в каталог
          </Link>
        </div>
      </div>
    );
  }

  return (
  <>
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              ЖИВОЙ КАТАЛОГ ИЗ БАЗЫ
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Товары бутика
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
              Каталог загружается из базы данных Prisma Product.
            </p>
            <p className="mt-2 text-sm text-emerald-300">Источник данных: Prisma Product / API</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedIndex(null);
                setDraft({
                  isNew: true,
                  barcode: "",
                  name: "",
                  article: "",
                  promo_price: "",
                  purchase_price: "",
                  retail_price: "",
                  stock_qty: "0",
                  store: storeFilter === "Все магазины" ? "Магазин 1" : storeFilter,
                  item_status: "READY_FOR_SALE",
                  image_url: "",
                });
                setSaveMessage("");
              }}
              className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-300 transition hover:bg-emerald-500/20"
            >
              Новый товар
            </button>

            <button
              type="button"
              onClick={() => loadCatalogFromDbFirst(true)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isRefreshing}
            >
{isRefreshing ? "Обновляю..." : "Обновить каталог"}
            </button>
          </div>
        </div>

        {refreshMessage === "success" && (
          <p className="mt-3 text-sm text-emerald-300">Каталог обновлён</p>
        )}

        {refreshMessage === "error" && (
          <p className="mt-3 text-sm text-red-300">Не удалось обновить каталог</p>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
            <div className="text-sm text-zinc-500">Всего товаров</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {stats.total}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
            <div className="text-sm text-zinc-500">READY_FOR_SALE</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {stats.ready}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
            <div className="text-sm text-zinc-500">С акц. ценой</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {stats.withPromo}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
            <div className="text-sm text-zinc-500">С розн. ценой</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {stats.withRetail}
            </div>
          </div>
        </div>

        {saveMessage && (
          <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {saveMessage}
          </div>
        )}
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
            <p className="mt-2 text-sm text-zinc-500">
              Нажми на строку товара, чтобы открыть карточку и отредактировать.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex w-full flex-col gap-2 md:w-[320px]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск: название, артикул, штрихкод"
                className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
              />
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="self-start text-xs text-zinc-400 transition hover:text-white"
                >
                  Очистить поиск
                </button>
              )}
            </div>

            <select
              value={storeFilter}
              onChange={(event) => setStoreFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none"
            >
              {stores.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-white/[0.04] text-zinc-400">
              <tr>
                <th className="px-4 py-4 font-medium">Фото</th>
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
              {filteredItems.map(({ item, index }) => (
                <tr
                  key={`${item.barcode}-${index}`}
                  onClick={() => openItem(index)}
                  className="cursor-pointer border-t border-white/10 bg-[#090909] transition hover:bg-white/[0.04]"
                >
                   <td className="px-4 py-4">
  {(item.image_url ?? "").trim() ? (
    <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-[#090909] shadow-sm">
      <img
        src={item.image_url}
        alt={item.name || "Фото товара"}
        className="h-full w-full object-cover"
      />
    </div>
  ) : (
    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-[#090909] text-[10px] leading-tight text-zinc-500">
      нет фото
    </div>
  )}
</td>
                  <td className="px-4 py-4 text-zinc-300">{item.barcode}</td>
                  <td className="px-4 py-4 text-white">{item.name}</td>
                  <td className="px-4 py-4 text-zinc-300">{item.article}</td>
                  <td className="px-4 py-4 text-zinc-300">{item.promo_price}</td>
                  <td className="px-4 py-4 text-zinc-300">{item.retail_price}</td>
                  <td className="px-4 py-4 text-zinc-300">{item.stock_qty}</td>
                  <td className="px-4 py-4 text-zinc-300">{item.store}</td>
                  <td className="px-4 py-4 text-zinc-300">{item.item_status}</td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    По текущему фильтру товаров не найдено.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {draft && (
      <div className="fixed inset-0 z-50 bg-black/70">
        <div className="absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#050505] p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                Карточка товара
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {draft.name || "Без названия"}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeItem}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:bg-white/[0.08]"
            >
              Закрыть
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm text-zinc-500">Штрихкод</div>
              <input
                value={draft.barcode}
                onChange={(event) => updateDraft("barcode", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm text-zinc-500">Артикул</div>
              <input
                value={draft.article}
                onChange={(event) => updateDraft("article", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="text-sm text-zinc-500">Название</div>
              <input
                value={draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none"
              />
            </div>
<div className="space-y-2 md:col-span-2">
  <div className="text-sm text-zinc-500">Фото (URL)</div>
  <input
    value={draft.image_url ?? ""}
    onChange={(event) => updateDraft("image_url", event.target.value)}
    className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none"
    placeholder="https://..."
  />
</div>

{(draft.image_url ?? "").trim() && (
  <div className="md:col-span-2">
    <div className="mb-2 text-sm text-zinc-500">Превью</div>
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#090909] p-3">
      <img
        src={draft.image_url}
        alt={draft.name || "Фото товара"}
        className="h-72 w-full object-contain"
      />
    </div>
  </div>
)}
            <div className="space-y-2">
              <div className="text-sm text-zinc-500">Акционная цена</div>
              <input
                value={draft.promo_price}
                onChange={(event) => updateDraft("promo_price", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm text-zinc-500">Розничная цена</div>
              <input
                value={draft.retail_price}
                onChange={(event) => updateDraft("retail_price", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm text-zinc-500">Закупочная цена</div>
              <input
                value={draft.purchase_price}
                onChange={(event) => updateDraft("purchase_price", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm text-zinc-500">Остаток</div>
              <input
                value={draft.stock_qty}
                onChange={(event) => updateDraft("stock_qty", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm text-zinc-500">Магазин</div>
              <select
                value={draft.store}
                onChange={(event) => updateDraft("store", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none"
              >
                {STORE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-zinc-500">Статус</div>
              <select
                value={draft.item_status}
                onChange={(event) => updateDraft("item_status", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveDraftToProduct}
              className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
            >
              Сохранить изменения
            </button>
{!draft.isNew && (
    <button
      type="button"
      onClick={deleteDraftFromProduct}
      className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
    >
      Удалить товар
    </button>
  )}
            <button
              type="button"
              onClick={closeItem}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white transition hover:bg-white/[0.08]"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
}
