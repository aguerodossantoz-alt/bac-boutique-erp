import { AppFrame } from "@/components/layout/app-frame";
import { InventorySession } from "@/components/inventory/inventory-session";
import { requireOwnerOrAdmin } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
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
      <InventorySession />
    </AppFrame>
  );
}