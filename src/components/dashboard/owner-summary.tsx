import { storeCards } from "@/data/dashboard-data";

export function OwnerSummary() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
        Сводка хозяина
      </div>

      <div className="mt-5 space-y-4">
        {storeCards.map((store) => (
          <div
            key={store.title}
            className="rounded-3xl border border-white/10 bg-[#090909] p-5"
          >
            <div className="text-xl font-medium text-white">{store.title}</div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-zinc-500">Выручка</div>
                <div className="mt-1 text-white">{store.revenue}</div>
              </div>
              <div>
                <div className="text-zinc-500">Прибыль</div>
                <div className="mt-1 text-white">{store.profit}</div>
              </div>
              <div>
                <div className="text-zinc-500">Остаток</div>
                <div className="mt-1 text-white">{store.stock}</div>
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <div className="text-sm text-zinc-500">Три цены в системе</div>
          <div className="mt-3 text-lg font-medium text-white">
            Закупочная / Акционная / Розничная
          </div>
        </div>
      </div>
    </div>
  );
}