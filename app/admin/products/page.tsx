// app/admin/products/page.tsx
import { requireAdmin } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { ProductList } from "@/components/admin/products/ProductList";
import { listProducts } from "@/lib/admin/products";
import { createServiceClient } from "@/lib/supabase/service";
import { softDeleteProduct, restoreProduct } from "./actions";

async function loadSectors(): Promise<Record<string, string>> {
  const svc = createServiceClient();
  const { data, error } = await svc.from("sectors").select("id, name");
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    const name = (row.name as Record<string, string>)?.tr ?? "";
    map[row.id] = name;
  }
  return map;
}

export default async function AdminProductsPage() {
  const user = await requireAdmin();
  const [active, deleted, sectors] = await Promise.all([
    listProducts({ active: true }),
    listProducts({ active: false }),
    loadSectors(),
  ]);

  async function softDelete(id: string) {
    "use server";
    await softDeleteProduct(id);
  }
  async function restore(id: string) {
    "use server";
    await restoreProduct(id);
  }

  return (
    <Shell user={user} active="products">
      <ProductList
        activeProducts={active}
        deletedProducts={deleted}
        sectors={sectors}
        softDelete={softDelete}
        restore={restore}
      />
    </Shell>
  );
}
