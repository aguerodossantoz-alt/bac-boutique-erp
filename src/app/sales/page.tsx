import { AppFrame } from "@/components/layout/app-frame";
import { SalesByBarcode } from "@/components/sales/sales-by-barcode";
import { requireUser } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const user = await requireUser();

  return (
    <AppFrame
      user={{
        role: user.role,
        username: user.username,
        store: user.store,
        displayName: user.session.user?.name ?? user.username,
      }}
    >
      <SalesByBarcode role={user.role} store={user.store} />
    </AppFrame>
  );
}