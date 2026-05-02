import { launchSteps } from "@/data/dashboard-data";

export function LaunchSteps() {
  return (
    <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
        Порядок запуска
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {launchSteps.map((step, index) => (
          <div
            key={step}
            className="rounded-3xl border border-white/10 bg-[#090909] p-5"
          >
            <div className="text-sm text-zinc-500">Шаг {index + 1}</div>
            <div className="mt-3 text-lg font-medium text-white">{step}</div>
          </div>
        ))}
      </div>
    </div>
  );
}