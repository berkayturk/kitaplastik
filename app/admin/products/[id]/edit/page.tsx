// app/admin/products/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { requireAdminRole } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { CloneButton } from "@/components/admin/products/CloneButton";
import type { SpecRow } from "@/components/admin/products/SpecBuilder";
import type { UploadedImage } from "@/components/admin/products/ImageUploader";
import { getProductById } from "@/lib/admin/products";
import { createServiceClient } from "@/lib/supabase/service";
import { updateProduct, cloneProduct } from "../../actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadSectorOptions() {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("sectors")
    .select("id, name, active")
    .order("display_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    id: s.id,
    label: (s.name as Record<string, string>)?.tr ?? s.id,
  }));
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAdminRole();
  const [product, sectors] = await Promise.all([getProductById(id), loadSectorOptions()]);
  if (!product) notFound();

  async function submit(fd: FormData) {
    "use server";
    await updateProduct(id, fd);
  }
  async function clone() {
    "use server";
    await cloneProduct(id);
  }

  return (
    <Shell user={user} active="products">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Düzenle: {product.name.tr || product.slug}</h1>
        <CloneButton action={clone} />
      </div>
      <ProductForm
        mode="edit"
        sectors={sectors}
        initial={{
          id: product.id,
          slug: product.slug,
          sector_id: product.sector_id ?? "",
          name: { tr: "", en: "", ru: "", ar: "", ...product.name },
          description: { tr: "", en: "", ru: "", ar: "", ...product.description },
          specs: (product.specs ?? []) as SpecRow[],
          images: (product.images ?? []) as UploadedImage[],
        }}
        action={submit}
      />
    </Shell>
  );
}
