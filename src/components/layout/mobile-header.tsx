"use client";

import { usePathname } from "next/navigation";

type MobileHeaderUser = {
  role: "owner" | "admin" | "cashier";
  username: string;
  store: string;
  displayName?: string;
};

const titles: Record<string, string> = {
  "/": "Дашборд",
  "/catalog": "Каталог",
  "/sales": "Продажи",
  "/inventory": "Инвентаризация",
  "/expenses": "Расходы",
  "/reports": "Отчеты",
};

export function MobileHeader({ user }: { user: MobileHeaderUser }) {
  const pathname = usePathname();
  const active = Object.keys(titles).find((href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)
  );

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/85 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur lg:hidden">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">BAC ERP</div>
          <h1 className="mt-1 text-lg font-semibold text-white">{active ? titles[active] : "BAC Boutique"}</h1>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-zinc-300">
          {user.displayName || user.username}
        </div>
      </div>
    </header>
  );
}
