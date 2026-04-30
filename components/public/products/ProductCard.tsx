import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { env } from "@/lib/env";
import { getImageAltText } from "@/lib/products/alt-text";

export interface PublicProduct {
  slug: string;
  sector_label?: string | null;
  name: Record<Locale, string>;
  images: Array<{ path: string; order: number; alt_text: Record<Locale, string> }>;
}

interface Props {
  product: PublicProduct;
  locale: Locale;
  imageLabel: string;
}

export function ProductCard({ product, locale, imageLabel }: Props) {
  const first = product.images?.[0];
  const url = first
    ? `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/product-images/${first.path}`
    : null;
  const alt = first ? getImageAltText({ name: product.name, locale, order: 0, imageLabel }) : "";

  return (
    <Link
      href={{ pathname: "/products/[slug]", params: { slug: product.slug } }}
      className="group block overflow-hidden rounded-md border border-[var(--color-border-subtle-dark)] bg-bg-primary transition hover:border-[var(--color-accent-cobalt)]"
    >
      <div className="relative aspect-[4/3] bg-bg-secondary">
        {url && (
          <Image
            src={url}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-contain"
            unoptimized
          />
        )}
      </div>
      <div className="p-4">
        {product.sector_label && (
          <p className="text-xs uppercase tracking-wide text-text-tertiary">{product.sector_label}</p>
        )}
        <h3 className="mt-1 font-medium text-text-primary">{product.name[locale]}</h3>
      </div>
    </Link>
  );
}
