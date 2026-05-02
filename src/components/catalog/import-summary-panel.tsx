import {
  duplicateRows,
  importErrors,
  importWarnings,
} from "@/data/import-validation-data";

export function ImportSummaryPanel() {
  const hasErrors = importErrors.length > 0;
  const canImport = !hasErrors;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Итог перед импортом
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Готовность загрузки
          </h2>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            canImport
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-red-400/20 bg-red-400/10 text-red-300"
          }`}
        >
          {canImport ? "Можно импортировать" : "Импорт пока заблокирован"}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
          <div className="text-sm text-zinc-500">Ошибки</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {importErrors.length}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
          <div className="text-sm text-zinc-500">Предупреждения</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {importWarnings.length}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
          <div className="text-sm text-zinc-500">Дубли</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {duplicateRows.length}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090909] p-5">
          <div className="text-sm text-zinc-500">Статус</div>
          <div className="mt-3 text-lg font-semibold text-white">
            {canImport ? "Готово" : "Нужна проверка"}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-white/10 bg-[#090909] p-5">
          <div className="text-sm uppercase tracking-[0.25em] text-zinc-500">
            Решение системы
          </div>

          <div className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
            {canImport ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-200">
                Все обязательные поля заполнены. Импорт можно запускать.
              </div>
            ) : (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">
                Есть критические ошибки. Сначала нужно исправить проблемные
                строки, потом запускать импорт.
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              Ошибки блокируют импорт полностью.
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              Предупреждения не блокируют импорт, но требуют проверки.
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              Дубли нужно проверить до загрузки в каталог.
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#090909] p-5">
          <div className="text-sm uppercase tracking-[0.25em] text-zinc-500">
            Действия
          </div>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              className={`w-full rounded-2xl px-4 py-4 text-left text-sm font-medium transition ${
                canImport
                  ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15"
                  : "cursor-not-allowed border border-red-400/20 bg-red-400/10 text-red-200 opacity-70"
              }`}
            >
              Подтвердить импорт
            </button>

            <button
              type="button"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left text-sm text-zinc-300 transition hover:bg-white/[0.08]"
            >
              Скачать отчет по ошибкам
            </button>

            <button
              type="button"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left text-sm text-zinc-300 transition hover:bg-white/[0.08]"
            >
              Вернуться к сопоставлению колонок
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}