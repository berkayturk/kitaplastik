import Link from "next/link";
import Image from "next/image";
import type { ProductRow as ProductRowData } from "@/lib/admin/products";
import { DeleteDialog } from "./DeleteDialog";
import { RestoreButton } from "./RestoreButton";
import { env } from "@/lib/env.client";

interface Props {
  product: ProductRowData;
  sectorName: string | null;
  onDelete: () => Promise<void>;
  onRestore: () => Promise<void>;
}

export function ProductRow({ product, sectorName, onDelete, onRestore }: Props) {
  const thumb = product.images?.[0]?.path;
  const url = thumb
    ? `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/product-images/${thumb}`
    : null;
  const filledBadges = (["tr", "en", "ru", "ar"] as const)
    .filter((l) => (product.name as Record<string, string>)[l]?.trim())
    .map((l) => l.toUpperCase())
    .join(" · ");

  return (
    <div className="flex items-center gap-3 border-b border-[var(--color-border-hairline)] py-2">
      <div className="bg-bg-secondary relative h-10 w-10 shrink-0 overflow-hidden rounded-sm">
        {url ? (
          <Image src={url} alt="" fill className="object-cover" sizes="40px" unoptimized />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{product.name.tr || "(isimsiz)"}</div>
        <div className="text-text-tertiary text-xs">
          {sectorName ?? "—"} · <span className="font-mono">{filledBadges}</span>
        </div>
      </div>
      <Link
        href={`/admin/products/${product.id}/edit`}
        className="text-sm font-medium text-[var(--color-accent-cobalt)] hover:underline"
      >
        Düzenle
      </Link>
      {product.active ? (
        <DeleteDialog productName={product.name.tr || product.slug} action={onDelete} />
      ) : (
        <RestoreButton action={onRestore} />
      )}
    </div>
  );
}
