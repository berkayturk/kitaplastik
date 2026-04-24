import { requireAdmin } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { ReferenceList } from "@/components/admin/references/ReferenceList";
import { listReferences } from "@/lib/admin/references";
import { listSectors } from "@/lib/admin/sectors";
import {
  softDeleteReference,
  restoreReference,
  moveReferenceUp,
  moveReferenceDown,
} from "./actions";

export default async function AdminReferencesPage() {
  const user = await requireAdmin();
  const [active, deleted, sectors] = await Promise.all([
    listReferences({ active: true }),
    listReferences({ active: false }),
    listSectors(),
  ]);

  const sectorsMap: Record<string, string> = {};
  for (const s of sectors) {
    const name = (s.name as Record<string, string>)?.tr ?? s.slug;
    sectorsMap[s.id] = name;
  }

  async function softDelete(id: string) {
    "use server";
    await softDeleteReference(id);
  }
  async function restore(id: string) {
    "use server";
    await restoreReference(id);
  }
  async function moveUp(id: string) {
    "use server";
    await moveReferenceUp(id);
  }
  async function moveDown(id: string) {
    "use server";
    await moveReferenceDown(id);
  }

  return (
    <Shell user={user} active="references">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Referanslar</h1>
        <ReferenceList
          activeRefs={active}
          deletedRefs={deleted}
          sectors={sectorsMap}
          actions={{ softDelete, restore, moveUp, moveDown }}
        />
      </div>
    </Shell>
  );
}
