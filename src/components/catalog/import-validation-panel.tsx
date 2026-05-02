import {
  duplicateRows,
  importErrors,
  importWarnings,
} from "@/data/import-validation-data";

export function ImportValidationPanel() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Проверка перед импортом
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Ошибки и дубли
          </h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-400">
          Перед импортом система должна показать проблемные строки
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5">
          <div className="text-sm text-red-300">Ошибки</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {importErrors.length}
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5">
          <div className="text-sm text-yellow-300">Предупреждения</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {importWarnings.length}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm text-zinc-400">Дубли</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {duplicateRows.length}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-[#090909] p-5">
          <div className="text-sm uppercase tracking-[0.25em] text-zinc-500">
            Ошибки
          </div>

          <div className="mt-4 space-y-3">
            {importErrors.map((item) => (
              <div
                key={`${item.row}-${item.column}`}
                className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4"
              >
                <div className="text-sm font-medium text-white">
                  Строка {item.row} · {item.column}
                </div>
                <div className="mt-2 text-sm text-red-200">{item.issue}</div>
                <div className="mt-1 text-xs text-red-300/80">
                  Значение: {item.value || "пусто"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#090909] p-5">
          <div className="text-sm uppercase tracking-[0.25em] text-zinc-500">
            Предупреждения
          </div>

          <div className="mt-4 space-y-3">
            {importWarnings.map((item) => (
              <div
                key={`${item.row}-${item.column}`}
                className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4"
              >
                <div className="text-sm font-medium text-white">
                  Строка {item.row} · {item.column}
                </div>
                <div className="mt-2 text-sm text-yellow-100">
                  {item.issue}
                </div>
                <div className="mt-1 text-xs text-yellow-200/80">
                  Значение: {item.value || "пусто"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-[#090909] p-5">
        <div className="text-sm uppercase tracking-[0.25em] text-zinc-500">
          Дубли
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-white/[0.04] text-sm text-zinc-400">
              <tr>
                <th className="px-4 py-4 font-medium">Строка</th>
                <th className="px-4 py-4 font-medium">Штрихкод</th>
                <th className="px-4 py-4 font-medium">Артикул</th>
                <th className="px-4 py-4 font-medium">Проблема</th>
              </tr>
            </thead>
            <tbody>
              {duplicateRows.map((item) => (
                <tr
                  key={`${item.row}-${item.barcode}`}
                  className="border-t border-white/10 text-sm"
                >
                  <td className="px-4 py-4 text-zinc-300">{item.row}</td>
                  <td className="px-4 py-4 text-zinc-300">{item.barcode}</td>
                  <td className="px-4 py-4 text-zinc-300">{item.article}</td>
                  <td className="px-4 py-4 text-white">{item.issue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}