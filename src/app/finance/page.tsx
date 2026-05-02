import { LiveFinanceDashboard } from "@/components/dashboard/live-finance-dashboard";
import { AppFrame } from "@/components/layout/app-frame";
import { requireOwnerOrAdmin } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const user = await requireOwnerOrAdmin();

  return (
    <AppFrame
      user={{
        role: user.role,
        username: user.username,
        store: user.store,
        displayName: user.session.user?.name ?? user.username,
      }}
    >
      <div className="p-4 lg:p-8">
        <LiveFinanceDashboard />
      </div>
    </AppFrame>
  );
}
