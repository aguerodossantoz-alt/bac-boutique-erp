import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { MobileHeader } from "./mobile-header";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { SalesNotifications } from "@/components/sales/sales-notifications";
import { PushNotificationToggle } from "@/components/push/push-notification-toggle";

type AppFrameUser = {
  role: "owner" | "admin" | "manager" | "cashier";
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

      <section className="pb-28 lg:pb-0 lg:pl-72">{children}</section>

      <MobileBottomNav user={user} />

      <PushNotificationToggle role={user.role} store={user.store} />
      <SalesNotifications role={user.role} store={user.store} />
    </main>
  );
}