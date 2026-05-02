export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur">
      <div className="px-5 py-5 md:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-zinc-500">
              Главный экран / Финансы / Онлайн
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Финансовая картина бутика
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-zinc-400">
              Поиск товара / штрихкода / клиента
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-zinc-300">
              Период: месяц
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white">
              Онлайн-доступ хозяина
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
            Магазин 1
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
            Магазин 2
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
            3 цены в системе
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            Сервер активен
          </div>
        </div>
      </div>
    </header>
  );
}