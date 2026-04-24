import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { ReferenceForm } from "@/components/admin/references/ReferenceForm";
import { listSectors } from "@/lib/admin/sectors";
import { getReferenceById } from "@/lib/admin/references";
import { updateReference } from "../../actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditReferencePage({ params }: PageProps) {
  const user = await requireAdmin();
  const { id } = await params;
  const [ref, sectors] = await Promise.all([getReferenceById(id), listSectors()]);
  if (!ref) notFound();

  return (
    <Shell user={user} active="references">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Referans Düzenle: {ref.key}</h1>
        <ReferenceForm
          mode="edit"
          sectors={sectors}
          initial={ref}
          defaultDisplayOrder={ref.display_order}
          action={updateReference}
        />
      </div>
    </Shell>
  );
}
