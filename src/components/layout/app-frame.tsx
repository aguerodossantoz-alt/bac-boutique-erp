import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";

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
      <section className="lg:pl-72">{children}</section>
    </main>
  );
}