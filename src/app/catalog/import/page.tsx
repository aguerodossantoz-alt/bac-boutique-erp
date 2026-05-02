import { ExcelImportClient } from "@/components/catalog/excel-import-client";
import { AppFrame } from "@/components/layout/app-frame";
import { requireOwnerOrAdmin } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function CatalogImportPage() {
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
      <ExcelImportClient />
    </AppFrame>
  );
}