import { recentSales } from "@/data/dashboard-data";

export function RecentSales() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">Последние продажи</h3>
        <div className="text-sm text-zinc-500">Сегодня</div>
      </div>

      <div className="mt-5 space-y-3">
        {recentSales.map((sale) => (
          <div
            key={`${sale.item}-${sale.store}`}
            className="flex items-center justify-between rounded-3xl border border-white/10 bg-[#090909] px-4 py-4"
          >
            <div>
              <div className="font-medium text-white">{sale.item}</div>
              <div className="mt-1 text-sm text-zinc-500">{sale.store}</div>
            </div>

            <div className="text-2xl font-semibold text-white">
              {sale.price}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}