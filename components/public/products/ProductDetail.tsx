import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ProductGallery } from "./ProductGallery";
import { ProductSpecTable } from "./ProductSpecTable";
import { env } from "@/lib/env";
import { toSafeLdJson } from "@/lib/products/json-ld";

interface Product {
  slug: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  images: Array<{ path: string; order: number; alt_text: Record<Locale, string> }>;
  specs: Array<{ preset_id: string; value: string }>;
}

interface Props {
  product: Product;
  locale: Locale;
  ctaLabel: string;
  imageLabel: string;
  specsLabel: string;
}

export function ProductDetail({ product, locale, ctaLabel, imageLabel, specsLabel }: Props) {
  const siteUrl = (env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com").replace(/\/$/, "");
  const imageBase = `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/product-images`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name[locale],
    description: product.description[locale] || undefined,
    image: product.images.map((i) => `${imageBase}/${i.path}`),
    sku: product.slug,
    brand: { "@type": "Brand", name: "Kıta Plastik" },
    url: `${siteUrl}/${locale}/products/${product.slug}`,
  };

  // TR kullanıcısı TR pretty-URL'e gider (redirect → /request-quote/standard). Diğer locale'ler direkt canonical.
  const standardRfqPathname =
    locale === "tr" ? "/teklif-iste/standart" : "/request-quote/standard";

  // JSON-LD: JSON.stringify içerik HTML context'ine girdiği için toSafeLdJson ile </script, <!-- ve U+2028/9 escape edilir
  return (
    <article className="grid gap-8 lg:grid-cols-[3fr_2fr]">
      <ProductGallery
        images={product.images}
        name={product.name}
        locale={locale}
        imageLabel={imageLabel}
      />
      <div>
        <h1 className="text-3xl font-semibold text-text-primary">{product.name[locale]}</h1>
        {product.description[locale] && (
          <p className="mt-4 whitespace-pre-line text-text-secondary">
            {product.description[locale]}
          </p>
        )}
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-tertiary">
            {specsLabel}
          </h2>
          <ProductSpecTable specs={product.specs} locale={locale} />
        </div>
        <Link
          href={{ pathname: standardRfqPathname, query: { product: product.slug } }}
          className="mt-8 inline-block rounded-sm bg-[var(--color-accent-red)] px-6 py-3 font-medium text-white hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      </div>
      <script
        type="application/ld+json"
        // toSafeLdJson tüm HTML-sensitive karakterleri \uXXXX'e çevirir; XSS-safe
        dangerouslySetInnerHTML={{ __html: toSafeLdJson(schema) }}
      />
    </article>
  );
}
