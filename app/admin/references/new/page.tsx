import { requireAdmin } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { ReferenceForm } from "@/components/admin/references/ReferenceForm";
import { listSectors } from "@/lib/admin/sectors";
import { maxDisplayOrder } from "@/lib/admin/references";
import { createReference } from "../actions";

export default async function NewReferencePage() {
  const user = await requireAdmin();
  const [sectors, maxOrder] = await Promise.all([listSectors(), maxDisplayOrder(true)]);

  return (
    <Shell user={user} active="references">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Yeni Referans</h1>
        <ReferenceForm
          mode="create"
          sectors={sectors}
          initial={null}
          defaultDisplayOrder={maxOrder + 10}
          action={createReference}
        />
      </div>
    </Shell>
  );
}
