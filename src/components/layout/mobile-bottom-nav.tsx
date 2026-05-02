"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MobileNavUser = {
  role: "owner" | "admin" | "cashier";
};

export function MobileBottomNav({ user }: { user: MobileNavUser }) {
  const pathname = usePathname();

  const navItems =
    user.role === "cashier"
      ? [{ label: "Продажи", href: "/sales" },
          { label: "Расходы", href: "/expenses" }]
      : [
          { label: "Дашборд", href: "/" },
          { label: "Каталог", href: "/catalog" },
          { label: "Продажи", href: "/sales" },
          { label: "Расходы", href: "/expenses" },
          { label: "Еще", href: "/reports" },
        ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
      <ul
        className={`grid gap-2 ${
          navItems.length === 1 ? "grid-cols-1" : navItems.length <= 4 ? "grid-cols-4" : "grid-cols-5"
        }`}
      >
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center justify-center rounded-xl border px-2 py-2 text-xs transition ${
                  isActive
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-transparent bg-white/[0.03] text-zinc-400"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
