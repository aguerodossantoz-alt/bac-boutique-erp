"use client";

import { useEffect, type ReactNode } from "react";
import { SessionProvider, signOut } from "next-auth/react";

type ProvidersProps = {
  children: ReactNode;
};

const SESSION_MODE_KEY = "bac_erp_session_mode";

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    const persistentMode = localStorage.getItem(SESSION_MODE_KEY);
    const sessionMode = sessionStorage.getItem(SESSION_MODE_KEY);

    if (persistentMode === "persistent") {
      return;
    }

    if (sessionMode === "session") {
      const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      const navType = entries[0]?.type;

      if (navType === "reload") {
        sessionStorage.removeItem(SESSION_MODE_KEY);
        void signOut({ redirect: true, callbackUrl: "/login" });
      }

      return;
    }

    void signOut({ redirect: true, callbackUrl: "/login" });
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
