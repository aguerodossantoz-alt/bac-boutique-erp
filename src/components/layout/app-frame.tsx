import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { MobileHeader } from "./mobile-header";
import { MobileBottomNav } from "./mobile-bottom-nav";

type AppFrameUser = {
  role: "owner" | "admin" | "cashier";
  username: string;
  store: string;
  displayName?: string;
};

type AppFrameProps = {
  children: ReactNode;
  user: AppFrameUser;
};

export function AppFrame({ children, user }: AppFrameProps) {
  const sidebarKey = `${user.username}-${user.role}-${user.store || "all"}`;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <AppSidebar key={sidebarKey} user={user} />
      <MobileHeader user={user} />
      <section className="pb-24 lg:pb-0 lg:pl-72">{children}</section>
      <MobileBottomNav user={user} />
    </main>
  );
}