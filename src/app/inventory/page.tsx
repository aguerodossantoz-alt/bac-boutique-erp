import { AppFrame } from "@/components/layout/app-frame";
import { InventorySession } from "@/components/inventory/inventory-session";
import { requireOwnerAdminOrManager } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
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
      <InventorySession />
    </AppFrame>
  );
}