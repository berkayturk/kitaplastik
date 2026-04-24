// app/admin/sectors/page.tsx
import { requireAdmin } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { SectorList } from "@/components/admin/sectors/SectorList";
import { listSectors } from "@/lib/admin/sectors";

export default async function AdminSectorsPage() {
  const user = await requireAdmin();
  const sectors = await listSectors();

  return (
    <Shell user={user} active="sectors">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Sektörler</h1>
        <SectorList sectors={sectors} />
      </div>
    </Shell>
  );
}
