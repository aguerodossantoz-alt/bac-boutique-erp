import { stats } from "@/data/dashboard-data";

export function StatsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5"
        >
          <div className="text-sm text-zinc-400">{stat.label}</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {stat.value}
          </div>
          <div className="mt-2 text-sm text-zinc-500">{stat.note}</div>
        </div>
      ))}
    </div>
  );
}