// app/admin/products/new/page.tsx
import { requireAdminRole } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { createServiceClient } from "@/lib/supabase/service";
import { createProduct } from "../actions";

async function loadSectorOptions() {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("sectors")
    .select("id, name, active")
    .eq("active", true)
    .order("display_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    id: s.id,
    label: (s.name as Record<string, string>)?.tr ?? s.id,
  }));
}

export default async function NewProductPage() {
  const user = await requireAdminRole();
  const sectors = await loadSectorOptions();

  async function submit(fd: FormData) {
    "use server";
    await createProduct(fd);
  }

  return (
    <Shell user={user} active="products">
      <h1 className="mb-4 text-xl font-semibold">Yeni Ürün</h1>
      <ProductForm
        mode="create"
        sectors={sectors}
        initial={{
          sector_id: "",
          name: { tr: "", en: "", ru: "", ar: "" },
          description: { tr: "", en: "", ru: "", ar: "" },
          specs: [],
          images: [],
        }}
        action={submit}
      />
    </Shell>
  );
}
