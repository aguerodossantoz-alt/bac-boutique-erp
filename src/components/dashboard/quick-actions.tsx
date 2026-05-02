import { quickActions } from "@/data/dashboard-data";

export function QuickActions() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Быстрые действия
          </div>
          <h3 className="mt-2 text-2xl font-semibold">Основные операции</h3>
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-zinc-400">
          Рабочая зона
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {quickActions.map((action) => (
          <div
            key={action}
            className="rounded-3xl border border-white/10 bg-[#090909] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="mb-4 h-1.5 w-14 rounded-full bg-white/80" />
            <div className="text-xl font-medium text-white">{action}</div>
            <div className="mt-3 text-sm leading-7 text-zinc-400">
              Модуль будет подключен следующим этапом разработки.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}