// app/admin/sectors/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { SectorForm } from "@/components/admin/sectors/SectorForm";
import { getSectorById } from "@/lib/admin/sectors";
import { updateSector } from "../../actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSectorPage({ params }: PageProps) {
  const user = await requireAdmin();
  const { id } = await params;
  const sector = await getSectorById(id);
  if (!sector) notFound();

  return (
    <Shell user={user} active="sectors">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Sektör Düzenle: {sector.slug}</h1>
        <SectorForm sector={sector} action={updateSector} />
      </div>
    </Shell>
  );
}
