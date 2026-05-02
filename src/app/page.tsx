import { AppFrame } from "@/components/layout/app-frame";
import { requireUser } from "@/lib/access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const user = await requireUser();

  if (user.role === "cashier") {
    redirect("/sales");
  }

  return (
    <AppFrame
      user={{
        role: user.role,
        username: user.username,
        store: user.store,
        displayName: user.session.user?.name ?? user.username,
      }}
    >
      <div className="p-6 lg:p-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:p-8">
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Дашборд
          </div>

          <h1 className="mt-2 text-3xl font-semibold text-white">
            Панель управления
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
            Главная страница ERP. Для владельца и администратора отсюда доступны
            каталог, продажи, инвентаризация, расходы и отчеты.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <a
              href="/catalog"
              className="rounded-2xl border border-white/10 bg-[#090909] p-5 text-white transition hover:bg-white/[0.04]"
            >
              <div className="text-sm text-zinc-500">Каталог</div>
              <div className="mt-2 text-xl font-semibold">Открыть</div>
            </a>

            <a
              href="/sales"
              className="rounded-2xl border border-white/10 bg-[#090909] p-5 text-white transition hover:bg-white/[0.04]"
            >
              <div className="text-sm text-zinc-500">Продажи</div>
              <div className="mt-2 text-xl font-semibold">Открыть</div>
            </a>

            <a
              href="/inventory"
              className="rounded-2xl border border-white/10 bg-[#090909] p-5 text-white transition hover:bg-white/[0.04]"
            >
              <div className="text-sm text-zinc-500">Инвентаризация</div>
              <div className="mt-2 text-xl font-semibold">Открыть</div>
            </a>

            <a
              href="/reports"
              className="rounded-2xl border border-white/10 bg-[#090909] p-5 text-white transition hover:bg-white/[0.04]"
            >
              <div className="text-sm text-zinc-500">Отчеты</div>
              <div className="mt-2 text-xl font-semibold">Открыть</div>
            </a>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}