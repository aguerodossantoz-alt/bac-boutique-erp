"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type AppRole = "owner" | "admin" | "manager" | "cashier";

type SidebarUser = {
  role: AppRole;
  username: string;
  store: string;
  displayName?: string;
};

type NavItem = {
  label: string;
  href: string;
};

export function AppSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  const navItems: NavItem[] =
    user.role === "cashier"
      ? [{ label: "Продажи", href: "/sales" }]
      : user.role === "manager"
      ? [
          { label: "Дашборд", href: "/" },
          { label: "Каталог", href: "/catalog" },
          { label: "Продажи", href: "/sales" },
          { label: "Инвентаризация", href: "/inventory" },
          { label: "Расходы", href: "/expenses" },
        ]
      : [
          { label: "Дашборд", href: "/" },
          { label: "Каталог", href: "/catalog" },
          { label: "Продажи", href: "/sales" },
          { label: "Инвентаризация", href: "/inventory" },
          { label: "Расходы", href: "/expenses" },
          { label: "Финансы", href: "/finance" },
          { label: "Отчеты", href: "/reports" },
        ];

  const roleLabel =
    user.role === "owner"
      ? "Хозяин / полный доступ"
      : user.role === "admin"
      ? "Администратор / полный доступ"
      : user.role === "manager"
      ? `Управляющий / ${user.store || "свой магазин"}`
      : user.store
      ? `Кассир / ${user.store}`
      : "Кассир";

  const accessLabel =
    user.role === "owner" || user.role === "admin"
      ? "Все магазины"
      : user.store || "Только свой магазин";

  const displayName = user.displayName?.trim() || user.username || "Пользователь";

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-white/10 bg-[#070707] lg:flex">
      <div className="border-b border-white/10 px-6 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-zinc-300">
          BAC BOUTIQUE ERP
        </div>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          Панель управления
        </h1>

        <p className="mt-3 text-sm leading-7 text-zinc-400">
          Продажи, каталог, инвентаризация, расходы и прибыль по каждому
          магазину.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-3 px-3 text-xs uppercase tracking-[0.3em] text-zinc-500">
          Навигация
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            const baseClass =
              "block rounded-2xl border px-4 py-3 text-sm transition";

            const activeClass = isActive
              ? "border-white/15 bg-white/10 text-white"
              : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${baseClass} ${activeClass}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">
            Доступ
          </div>
          <div className="mt-4 text-sm leading-8 text-zinc-300">
            Роль: {roleLabel}
            <br />
            Магазины: {accessLabel}
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">
            Система цен
          </div>
          <div className="mt-4 text-sm leading-8 text-zinc-300">
            Закупочная
            <br />
            Акционная
            <br />
            Розничная
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">
            Пользователь
          </div>

          <div className="mt-2 text-sm font-medium text-white">
            {displayName}
          </div>

          <div className="mt-1 text-xs text-zinc-400">{roleLabel}</div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
          >
            Выйти
          </button>
        </div>
      </div>
    </aside>
  );
}
