import { lowStock } from "@/data/dashboard-data";

export function LowStock() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">Низкий остаток</h3>
        <div className="text-sm text-zinc-500">Контроль</div>
      </div>

      <div className="mt-5 space-y-3">
        {lowStock.map((item) => (
          <div
            key={`${item.name}-${item.size}`}
            className="flex items-center justify-between rounded-3xl border border-white/10 bg-[#090909] px-4 py-4"
          >
            <div>
              <div className="font-medium text-white">{item.name}</div>
              <div className="mt-1 text-sm text-zinc-500">
                Размер: {item.size}
              </div>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm text-white">
              Осталось: {item.left}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}