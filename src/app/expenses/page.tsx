import { ExpensesManager } from "@/components/expenses/expenses-manager";
import { AppFrame } from "@/components/layout/app-frame";
import { requireOwnerAdminOrManager } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const user = await requireOwnerAdminOrManager();

  return (
    <AppFrame
      user={{
        role: user.role,
        username: user.username,
        store: user.store,
        displayName: user.session.user?.name ?? user.username,
      }}
    >
      <ExpensesManager />
    </AppFrame>
  );
}