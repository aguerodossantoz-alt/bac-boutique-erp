import { AppFrame } from "@/components/layout/app-frame";
import { MonthlyProfitReport } from "@/components/reports/monthly-profit-report";
import { requireOwnerOrAdmin } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
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
      <MonthlyProfitReport />
    </AppFrame>
  );
}