import type { Locale } from "@/i18n/routing";
import { ProductCard, type PublicProduct } from "./ProductCard";

interface Props {
  products: PublicProduct[];
  locale: Locale;
  imageLabel: string;
}

export function ProductGrid({ products, locale, imageLabel }: Props) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-text-secondary">Henüz yayında ürün yok.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} locale={locale} imageLabel={imageLabel} />
      ))}
    </div>
  );
}
